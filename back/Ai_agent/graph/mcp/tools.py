from contextlib import AsyncExitStack
from langsmith import traceable
from graph.mcp.clients import NEARBY_SITES_MCP


def _extract_text(result) -> str:
    if hasattr(result, "data") and result.data:
        return result.data
    if hasattr(result, "content") and result.content:
        return result.content[0].text
    return str(result)


@traceable(name="get_nearby_sites")
async def _call_nearby_sites(params: dict) -> str:
    result = await NEARBY_SITES_MCP.call_tool("get_nearby_sites", params)
    return _extract_text(result)


@traceable(name="get_recent_sites")
async def _call_recent_sites(params: dict) -> str:
    result = await NEARBY_SITES_MCP.call_tool("get_recent_sites", params)
    return _extract_text(result)


@traceable(name="mcp_tool_calls")
async def call_selected_tools(
    use_nearby_sites: bool = False,
    use_recent_sites: bool = False,
    user_lat: float = None,
    user_lng: float = None,
    categories: list = None,
    name_search: str = None,
    sites_count: int = 5,
) -> dict:
    if not use_nearby_sites and not use_recent_sites:
        return {}

    async with AsyncExitStack() as stack:
        await stack.enter_async_context(NEARBY_SITES_MCP)
        results = {}

        if use_nearby_sites:
            params = {"count": sites_count, "include_temporary": True}
            if user_lat is not None and user_lng is not None:
                params["user_lat"] = user_lat
                params["user_lng"] = user_lng
            if categories:
                params["categories"] = categories
            if name_search:
                params["name_search"] = name_search
            try:
                results["nearby_sites"] = await _call_nearby_sites(params)
            except Exception as e:
                results["nearby_sites"] = f"שגיאה: {e}"

        if use_recent_sites:
            params = {"count": sites_count}
            if categories:
                params["categories"] = categories
            try:
                results["recent_sites"] = await _call_recent_sites(params)
            except Exception as e:
                results["recent_sites"] = f"שגיאה: {e}"

        return results
