from __future__ import annotations

from graph.chains.tool_router import tool_selection_chain


def choose_tools(query: str, recent_context: str = "") -> dict:
    """One LLM call: decide tool usage + categories + name search together."""
    fallback = {"use_nearby_sites": False, "use_recent_sites": False, "categories": [], "name_search": None, "sites_count": 5}
    try:
        result = tool_selection_chain.invoke({
            "query": query,
            "recent_context": recent_context or "(אין הקשר קודם)",
        })
        return {
            "use_nearby_sites": bool(result.use_nearby_sites),
            "use_recent_sites": bool(result.use_recent_sites),
            "categories": result.categories or [],
            "name_search": result.name_search,
            "sites_count": result.sites_count,
        }
    except Exception as e:
        print(f"[tool_router] ERROR: {e}")
        return fallback
