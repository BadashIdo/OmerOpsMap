import asyncio
from contextlib import AsyncExitStack
from graph.mcp.clients import NEARBY_SITES_MCP
from graph.agents.tool_router import select_categories


async def call_selected_tools(
    query: str,
    use_nearby_sites: bool = False,
    user_lat: float = None,
    user_lng: float = None,
    sites_count: int = 8
) -> dict:
    """
    Call selected MCP tools based on the query.
    
    Args:
        query: The user's query
        use_nearby_sites: Whether to search for nearby sites
        user_lat: User's latitude (for nearby sites)
        user_lng: User's longitude (for nearby sites)
        sites_count: Number of nearby sites to return
    """
    results = {}

    if not use_nearby_sites:
        return results

    async with AsyncExitStack() as stack:
        await stack.enter_async_context(NEARBY_SITES_MCP)

        # Use LLM to select relevant categories and/or place name
        selection = select_categories(query)
        categories = selection.get("categories", [])
        name_search = selection.get("name_search")
        
        params = {
            "count": sites_count,
            "include_temporary": True
        }
        
        # Add location only if both lat and lng are provided
        if user_lat is not None and user_lng is not None:
            params["user_lat"] = user_lat
            params["user_lng"] = user_lng
        
        # Add categories if found
        if categories:
            params["categories"] = categories
        
        # Add name search if found
        if name_search:
            params["name_search"] = name_search
        
        try:
            result = await NEARBY_SITES_MCP.call_tool("get_nearby_sites", params)
            results["nearby_sites"] = result
        except Exception as e:
            results["nearby_sites"] = {"error": str(e)}

    return results
