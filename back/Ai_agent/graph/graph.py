from dotenv import load_dotenv

from langgraph.graph import END, StateGraph, START

from graph.chains.hallucination_grader import hallucination_grader
from graph.chains.router import question_router, RouteQuery
from graph.consts import MODERATE, TOOL_AGENT
from graph.nodes import moderate
from graph.state import GraphState

load_dotenv()


def decide_after_moderation(state: GraphState):

    return "allowed" if state.get("is_allowed", True) else "blocked"


workflow = StateGraph(GraphState)

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

app.get_graph().draw_mermaid_png(output_file_path="graph.png")