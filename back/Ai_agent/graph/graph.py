from dotenv import load_dotenv

from langgraph.graph import END, StateGraph, START

from graph.nodes.tool_agent import tool_agent
from graph.consts import MODERATE, TOOL_AGENT
from graph.nodes.moderate import moderate
from graph.state import GraphState

load_dotenv()


def decide_after_moderation(state: GraphState):

    return "allowed" if state.get("is_allowed", True) else "blocked"


workflow = StateGraph(GraphState)

workflow.add_edge(START, MODERATE)
workflow.add_node(MODERATE, moderate)
workflow.add_node(TOOL_AGENT, tool_agent)


workflow.add_conditional_edges(
    MODERATE,
    decide_after_moderation,
    {
        "allowed": TOOL_AGENT,
        "blocked": END,
    },
)

workflow.add_edge(TOOL_AGENT,END)


app = workflow.compile()

if __name__ == "__main__":
    app.get_graph().draw_mermaid_png("omer_agent_graph.png")