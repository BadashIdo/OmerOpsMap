from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from graph.state import GraphState
from graph.agents.tool_router import decide_tools
from graph.mcp.tools import call_selected_tools


llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

SYSTEM_PROMPT = """אתה עוזר עירוני חכם של היישוב עומר.
אתה עונה בעברית בצורה ידידותית ומקצועית.
יש לך גישה למיקום GPS האמיתי של המשתמש (אם זמין).
כשמציגים מרחקים לאתרים - הם מחושבים מהמיקום האמיתי של המשתמש.
התמקד בשאלה הנוכחית ובמידת הצורך השתמש בהיסטוריית השיחה."""

final_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", SYSTEM_PROMPT),
        ("human", """היסטוריית השיחה:
{context_window}

---

📍 מיקום GPS של המשתמש: {location_display}

שאלה נוכחית: {query}

תוצאות כלים (אם רלוונטי):
{tool_results}

ענה על השאלה בעברית. המרחקים מחושבים מהמיקום האמיתי של המשתמש.""")
    ]
)


async def tool_agent(state: GraphState) -> GraphState:
    query = state["query"]
    context_window = state.get("context_window", "")
    self_location = state.get("self_location", "")

    # 1️⃣ Decide which tools are needed
    decision = decide_tools(query)
    use_web = bool(decision.get("use_web", False))
    use_math = bool(decision.get("use_math", False))
    use_nearby_sites = bool(decision.get("use_nearby_sites", False))

    # Parse user location if provided (format: "lat,lng")
    user_lat, user_lng = None, None
    if self_location:
        try:
            parts = self_location.split(",")
            if len(parts) == 2:
                user_lat = float(parts[0].strip())
                user_lng = float(parts[1].strip())
        except (ValueError, AttributeError):
            pass

    # 2️⃣ Call MCP tools in parallel
    tool_results = await call_selected_tools(
        query=query,
        use_web=use_web,
        use_math=use_math,
        use_nearby_sites=use_nearby_sites,
        user_lat=user_lat,
        user_lng=user_lng,
    )

    # 3️⃣ Generate final answer with context
    messages = final_prompt.format_messages(
        context_window=context_window if context_window else "(אין היסטוריה קודמת)",
        query=query, 
        tool_results=tool_results if tool_results else "(לא נעשה שימוש בכלים)",
        location_display=location_display
    )
    msg = await llm.ainvoke(messages)
    answer = msg.content

    return {
        **state,
        "tool_results": tool_results,
        "final_answer": answer,
    }
