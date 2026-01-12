# graph/chains/tool_router.py
from __future__ import annotations

from dotenv import load_dotenv
load_dotenv()

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableSequence
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field


# LLM
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)


class ToolDecision(BaseModel):
    """Which tools to use for the query."""
    use_web: bool = Field(description="Use web_search tool for factual / up-to-date info.")
    use_math: bool = Field(description="Use math tool for calculations.")


structured_router = llm.with_structured_output(ToolDecision)

SYSTEM = (
    "You decide which tools are required to answer the user query.\n"
    "Tools:\n"
    "- web_search: for up-to-date or factual information\n"
    "- math: for calculations\n"
    "Return a tool decision."
)

router_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", SYSTEM),
        ("human", "User query: {query}"),
    ]
)

# router_chain.invoke({"query": "..."}) -> ToolDecision
router_chain: RunnableSequence = router_prompt | structured_router
