from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from graph.state import GraphState
from graph.agents.tool_router import decide_tools
from graph.mcp.tools import call_selected_tools


llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

final_prompt = ChatPromptTemplate.from_messages(
    [
            ("system", "You are a helpful municipal assistant for the community settlement of Omer."),
            ("human", "Question: {query}\n\nTool results:\n{tool_results}")
        ]
)


async def tool_agent(state: GraphState) -> GraphState:
    query = state["query"]

    # 1️⃣ Decide which tools are needed
    decision = decide_tools(query)
    use_web = bool(decision.get("use_web", False))
    use_math = bool(decision.get("use_math", False))

    # 2️⃣ Call MCP tools in parallel
    tool_results = await call_selected_tools(
        query=query,
        use_web=use_web,
        use_math=use_math,
    )

    # 3️⃣ Generate final answer
    messages = final_prompt.format_messages(query=query, tool_results=tool_results)
    msg = await llm.ainvoke(messages)
    answer = msg.content

    return {
        **state,
        "tool_results": tool_results,
        "final_answer": answer,
    }
