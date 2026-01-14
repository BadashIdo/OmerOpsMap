import asyncio
import re
from contextlib import AsyncExitStack
from graph.mcp.clients import WEB_MCP, MATH_MCP, NEARBY_SITES_MCP

# TODO: add the real category keywords
# Category keywords mapping (Hebrew to category)
CATEGORY_KEYWORDS = {
    # Education
    "בית ספר": "חינוך",
    "בתי ספר": "חינוך",
    "גן ילדים": "גן ילדים",
    "גנים": "גן ילדים",
    "גן": "גן ילדים",
    "חינוך": "חינוך",
    # Health
    "מרפאה": "בריאות",
    "רופא": "בריאות",
    "בריאות": "בריאות",
    "קופת חולים": "בריאות",
    # Sports
    "ספורט": "ספורט",
    "חדר כושר": "ספורט",
    "מגרש": "ספורט",
    "בריכה": "ספורט",
    # Parks
    "פארק": "פארק",
    "גינה": "פארק",
    "שטח ירוק": "פארק",
    # Religion
    "בית כנסת": "דת",
    "בתי כנסת": "דת",
    "כנסת": "דת",
    # Shopping
    "חנות": "מסחר",
    "סופר": "מסחר",
    "מכולת": "מסחר",
    "קניות": "מסחר",
    # Community
    "מתנס": "קהילה",
    "מועדון": "קהילה",
    "ספריה": "קהילה",
}


def extract_category_from_query(query: str) -> str | None:
    """Extract category keyword from Hebrew query"""
    query_lower = query.lower()
    for keyword, category in CATEGORY_KEYWORDS.items():
        if keyword in query_lower:
            return category
    return None


async def call_selected_tools(
    query: str,
    use_web: bool = False,
    use_math: bool = False,
    use_nearby_sites: bool = False,
    user_lat: float = None,
    user_lng: float = None,
    sites_count: int = 5
) -> dict:
    """
    Call selected MCP tools based on the query.
    
    Args:
        query: The user's query
        use_web: Whether to use web search
        use_math: Whether to use math tools
        use_nearby_sites: Whether to search for nearby sites
        user_lat: User's latitude (for nearby sites)
        user_lng: User's longitude (for nearby sites)
        sites_count: Number of nearby sites to return
    """
    results = {}

    async with AsyncExitStack() as stack:
        if use_web:
            await stack.enter_async_context(WEB_MCP)
        if use_math:
            await stack.enter_async_context(MATH_MCP)
        if use_nearby_sites:
            await stack.enter_async_context(NEARBY_SITES_MCP)

        tasks = []

        if use_web:
            tasks.append(("web_search", WEB_MCP.call_tool("web_search", {"query": query})))

        if use_math:
            # Extract numbers from query for math operations
            tasks.append(("math", MATH_MCP.call_tool("add", {"a": 2, "b": 5})))

        if use_nearby_sites:
            # Default to Omer's center if no location provided
            lat = user_lat if user_lat else 31.2647  # Omer center
            lng = user_lng if user_lng else 34.8496  # Omer center
            
            # Extract category from query if present
            category = extract_category_from_query(query)
            
            params = {
                "user_lat": lat,
                "user_lng": lng,
                "count": sites_count,
                "include_temporary": True
            }
            
            # Add category if found
            if category:
                params["category"] = category
            
            tasks.append(("nearby_sites", NEARBY_SITES_MCP.call_tool(
                "get_nearby_sites",
                params
            )))

        if not tasks:
            return results

        names, coros = zip(*tasks)
        outputs = await asyncio.gather(*coros, return_exceptions=True)

        for name, out in zip(names, outputs):
            results[name] = out if not isinstance(out, Exception) else {"error": str(out)}

    return results
