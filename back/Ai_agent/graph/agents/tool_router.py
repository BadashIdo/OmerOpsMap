# graph/agents/tool_router.py
from __future__ import annotations

from graph.chains.tool_router import router_chain, category_chain


def decide_tools(query: str, recent_context: str = "") -> dict:
    """Decide which tools to use based on query and recent conversation context."""
    # default fallback 
    fallback = {"use_nearby_sites": False}

    try:
        decision = router_chain.invoke({
            "query": query,
            "recent_context": recent_context if recent_context else "(אין הקשר קודם)"
        })
        # decision הוא ToolDecision (Pydantic)
        return {
            "use_nearby_sites": bool(getattr(decision, "use_nearby_sites", False)),
        }
    except Exception:
        return fallback


def select_categories(query: str) -> dict:
    """Use LLM to select relevant categories and/or place name for the query."""
    try:
        result = category_chain.invoke({"query": query})
        return {
            "categories": result.categories if result.categories else [],
            "name_search": result.name_search
        }
    except Exception:
        return {"categories": [], "name_search": None}
