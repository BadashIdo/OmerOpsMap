from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from graph.state import GraphState
from graph.agents.tool_router import choose_tools
from graph.mcp.tools import call_selected_tools
from configuration.loader import get_llm_config
from configuration.prompts import CITIZEN_ASSISTANT_SYSTEM, CITIZEN_ASSISTANT_HUMAN

llm_config = get_llm_config("main_llm")
llm = ChatOpenAI(model=llm_config["model_name"], temperature=llm_config["temperature"])

final_prompt = ChatPromptTemplate.from_messages([
    ("system", CITIZEN_ASSISTANT_SYSTEM),
    ("human", CITIZEN_ASSISTANT_HUMAN),
])


def _parse_location(self_location: str) -> tuple[float | None, float | None]:
    if not self_location:
        return None, None
    try:
        parts = self_location.split(",")
        if len(parts) == 2:
            return float(parts[0].strip()), float(parts[1].strip())
    except (ValueError, AttributeError):
        pass
    return None, None


def _recent_context(full_context: str, num_messages: int = 4) -> str:
    if not full_context:
        return ""
    lines = full_context.strip().split("\n")
    messages, current = [], []
    for line in lines:
        if line.startswith("[User]:") or line.startswith("[AI]:"):
            if current:
                messages.append("\n".join(current))
            current = [line]
        else:
            current.append(line)
    if current:
        messages.append("\n".join(current))
    return "\n".join(messages[-num_messages:])


async def tool_agent(state: GraphState) -> GraphState:
    query = state["query"]
    context_window = state.get("context_window", "")
    self_location = state.get("self_location") or "מיקום עצמי כבוי"

    selection = choose_tools(query, _recent_context(context_window))
    user_lat, user_lng = _parse_location(self_location)

    print(f"\n{'='*60}")
    print(f"[1] QUERY: {query!r}")
    print(f"[2] SELF_LOCATION raw: {self_location!r}")
    print(f"[3] PARSED: lat={user_lat}, lng={user_lng}")
    print(f"[4] SELECTION: {selection}")

    tool_results = await call_selected_tools(
        use_nearby_sites=selection["use_nearby_sites"],
        use_recent_sites=selection["use_recent_sites"],
        user_lat=user_lat,
        user_lng=user_lng,
        categories=selection["categories"],
        name_search=selection["name_search"],
        sites_count=selection.get("sites_count", 5),
    )

    print(f"[5] TOOL_RESULTS type: {type(tool_results)}")
    print(f"[5] TOOL_RESULTS keys: {list(tool_results.keys()) if tool_results else 'empty'}")
    if tool_results:
        for k, v in tool_results.items():
            print(f"[5] TOOL_RESULTS[{k!r}] (type={type(v).__name__}):")
            print(f"    {str(v)[:500]}")

    # Extract plain text so the LLM gets clean formatted text, not a Python dict repr
    parts = [v for v in (tool_results or {}).values() if v]
    tool_results_str = "\n\n".join(parts) if parts else "(לא נעשה שימוש בכלים)"

    print(f"[5b] TOOL_RESULTS_STR passed to LLM (first 400):")
    print(tool_results_str[:400])

    messages = final_prompt.format_messages(
        context_window=context_window or "(אין היסטוריה קודמת)",
        query=query,
        tool_results=tool_results_str,
        self_location=self_location,
    )

    print(f"[6] SYSTEM PROMPT (first 300 chars):")
    print(f"    {messages[0].content[:300]}")
    print(f"[6] HUMAN PROMPT (last 600 chars):")
    print(f"    {messages[1].content[-600:]}")

    msg = await llm.ainvoke(messages)

    print(f"[7] LLM RESPONSE:")
    print(f"    {msg.content[:600]}")
    print(f"{'='*60}\n")

    return {
        **state,
        "tool_results": tool_results,
        "final_answer": msg.content,
    }
