from __future__ import annotations

from dotenv import load_dotenv
load_dotenv()

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableSequence
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

from configuration.loader import get_llm_config
from configuration.prompts import (
    TOOL_SELECTION_SYSTEM,
    TOOL_SELECTION_HUMAN,
    AVAILABLE_SUB_CATEGORIES,
)

config = get_llm_config("tool_router_llm")
llm = ChatOpenAI(model=config["model_name"], temperature=config["temperature"])


class ToolSelection(BaseModel):
    """Single decision: which tools to use and how to query them."""
    use_nearby_sites: bool = Field(
        description="True if the query is about finding places/services in עומר."
    )
    use_recent_sites: bool = Field(
        default=False,
        description="True if the query is about what is new, recently added, or recently updated in עומר (e.g. 'מה חדש', 'מה נוסף לאחרונה', 'מה חדש בתחבורה')."
    )
    categories: list[str] = Field(
        default=[],
        description=f"Relevant sub-categories from: {', '.join(AVAILABLE_SUB_CATEGORIES)}. Fill whenever use_nearby_sites or use_recent_sites is True and the query mentions a topic. Empty only if no specific topic is mentioned."
    )
    name_search: str | None = Field(
        default=None,
        description="Specific place/site name if the user asks about a specific place. Null otherwise."
    )


_prompt = ChatPromptTemplate.from_messages([
    ("system", TOOL_SELECTION_SYSTEM),
    ("human", TOOL_SELECTION_HUMAN),
])

tool_selection_chain: RunnableSequence = _prompt | llm.with_structured_output(ToolSelection)
