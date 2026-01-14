from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from graph.state import GraphState
from graph.agents.tool_router import decide_tools
from graph.mcp.tools import call_selected_tools


from configuration.loader import get_llm_config

# Load configuration
llm_config = get_llm_config("main_llm")
llm = ChatOpenAI(
    model=llm_config["model_name"],
    temperature=llm_config["temperature"]
)

SYSTEM_PROMPT = """אתה עוזר עירוני חכם של היישוב עומר.
אתה עונה בעברית בצורה ידידותית ומקצועית.
יש לך גישה למיקום GPS האמיתי של המשתמש (אם זמין).
ענה את התשובה הטובה ביותר שתענה על שאלת המשתמש (תושב היישוב עומר).
אתענה לתושב תשובות עם מרחקים מדויקיים גם אם הוא רחוק!
"""


final_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", SYSTEM_PROMPT),
        ("human", """היסטוריית השיחה:
{context_window}

---

📍 מיקום GPS של המשתמש: {self_location}

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

    # Extract last 4 messages for tool decision context
    def get_recent_context(full_context: str, num_messages: int = 4) -> str:
        if not full_context:
            return ""
        lines = full_context.strip().split("\n")
        # Each message starts with [User] or [AI]
        messages = []
        current_msg = []
        for line in lines:
            if line.startswith("[User]:") or line.startswith("[AI]:"):
                if current_msg:
                    messages.append("\n".join(current_msg))
                current_msg = [line]
            else:
                current_msg.append(line)
        if current_msg:
            messages.append("\n".join(current_msg))
        # Return last N messages
        recent = messages[-num_messages:] if len(messages) > num_messages else messages
        return "\n".join(recent)
    
    recent_context = get_recent_context(context_window, 4)
    
    # 1️⃣ Decide if nearby_sites tool is needed (with recent context)
    decision = decide_tools(query, recent_context)
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

    # 2️⃣ Call MCP tools
    tool_results = await call_selected_tools(
        query=query,
        use_nearby_sites=use_nearby_sites,
        user_lat=user_lat,
        user_lng=user_lng,
    )

    # 3️⃣ Generate final answer with context
    messages = final_prompt.format_messages(
        context_window=context_window if context_window else "(אין היסטוריה קודמת)",
        query=query, 
        tool_results=tool_results if tool_results else "(לא נעשה שימוש בכלים)",
        self_location=self_location
    )
    msg = await llm.ainvoke(messages)
    answer = msg.content

    return {
        **state,
        "tool_results": tool_results,
        "final_answer": answer,
    }
