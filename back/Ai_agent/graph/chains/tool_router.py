# graph/chains/tool_router.py
from __future__ import annotations

from dotenv import load_dotenv
load_dotenv()

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableSequence
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field


from configuration.loader import get_llm_config

# Load configurations
router_config = get_llm_config("tool_router_llm")
category_config = get_llm_config("category_selector_llm")

# Initialize LLMs
router_llm = ChatOpenAI(
    model=router_config["model_name"],
    temperature=router_config["temperature"]
)

category_llm = ChatOpenAI(
    model=category_config["model_name"],
    temperature=category_config["temperature"]
)


class ToolDecision(BaseModel):
    """Which tools to use for the query."""
    use_nearby_sites: bool = Field(description="Use nearby_sites tool to find places/services near the user (schools, clinics, parks, etc.)")


structured_router = router_llm.with_structured_output(ToolDecision)

SYSTEM = (
    "You decide if the nearby_sites tool is required to answer the user query.\n"
    "This is for the community of Omer (עומר) in Israel.\n"
    "Use nearby_sites for:\n"
    "- Finding places, services, or points of interest in Omer\n"
    "- Questions about schools, kindergartens, clinics, parks, synagogues, shops, etc.\n"
    "- Questions like 'what is near me', 'where is...', 'find...'\n"
    "- Follow-up questions about places mentioned in the recent conversation\n"
    "Do NOT use for general conversation or questions not about places.\n"
    "Consider the recent conversation context when making your decision if needed.\n"
    "Return the tool decision."
)

router_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", SYSTEM),
        ("human", """Recent conversation:
{recent_context}

Current query: {query}"""),
    ]
)

# router_chain.invoke({"query": "...", "recent_context": "..."}) -> ToolDecision
router_chain: RunnableSequence = router_prompt | structured_router


# ========== Category Selection ==========
# Available sub-categories from DB
AVAILABLE_CATEGORIES = [
    "בית כנסת", "בתי ספר", "גינות כלבים", "גינות משחקים",
    "גני ילדים ופעוטונים", "גנים ופארקים", "חירום וביטחון",
    "חניונים וחניה", "טבע ומורשת", "מוסדות קהילה", "מוקדי שירות",
    "מסחר והסעדה", "מרכז גמלאים", "מרכזי מחזור", "מרכזי נוער",
    "משרדי מועצה", "מתקני ספורט", "שירותי בריאות", "שירותי דת",
    "שירותים לתושב", "תחבורה ציבורית", "תנועות נוער ומועדונים",
    "תפעול שוטף", "תשתיות דרך"
]


class CategorySelection(BaseModel):
    """Selected categories and/or place name relevant to the user query."""
    categories: list[str] = Field(
        default=[],
        description="List of relevant sub-categories from the available list. Empty if none match."
    )
    name_search: str | None = Field(
        default=None,
        description="Specific place/site name to search for if the user is asking about a specific place (not a category). For example: 'עומרים', 'ספריה', etc."
    )


structured_category_selector = category_llm.with_structured_output(CategorySelection)

CATEGORY_SYSTEM = (
    "You analyze the user's query about places in Omer (עומר) and determine:\n"
    "1. Which sub-categories are relevant (if asking about a TYPE of place)\n"
    "2. A specific place NAME to search for (if asking about a SPECIFIC place)\n\n"
    f"Available sub-categories:\n{', '.join(AVAILABLE_CATEGORIES)}\n\n"
    "Rules:\n"
    "- If user asks about a TYPE of place (בתי כנסת, מרפאות, etc.) → return categories\n"
    "- If user asks about a SPECIFIC place by name (עומרים, ספריה, הדס, etc.) → return name_search\n"
    "- You can return BOTH if relevant\n\n"
    "Examples:\n"
    "- 'איפה יש בתי כנסת?' → categories: ['בית כנסת', 'שירותי דת'], name_search: null\n"
    "- 'איפה זה עומרים?' → categories: [], name_search: 'עומרים'\n"
    "- 'איפה נמצא בית הספר עומרים?' → categories: ['בתי ספר'], name_search: 'עומרים'\n"
    "- 'איפה הספריה?' → categories: [], name_search: 'ספריה'\n"
    "- 'מה יש לידי?' → categories: [], name_search: null (general query)\n"
)

category_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", CATEGORY_SYSTEM),
        ("human", "User query: {query}"),
    ]
)

# category_chain.invoke({"query": "..."}) -> CategorySelection
category_chain: RunnableSequence = category_prompt | structured_category_selector
