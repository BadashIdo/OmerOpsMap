import asyncio
from contextlib import AsyncExitStack
from graph.mcp.clients import WEB_MCP, MATH_MCP


async def call_selected_tools(query: str, use_web: bool, use_math: bool) -> dict:
    results = {}

    async with AsyncExitStack() as stack:
        if use_web:
            await stack.enter_async_context(WEB_MCP)
        if use_math:
            await stack.enter_async_context(MATH_MCP)

        tasks = []

        if use_web:
            tasks.append(("web_search", WEB_MCP.call_tool("web_search", {"query": query})))

        if use_math:
            #placeholder
            tasks.append(("math", MATH_MCP.call_tool("add", {"a": 2, "b": 5})))

        if not tasks:
            return results

        names, coros = zip(*tasks)
        outputs = await asyncio.gather(*coros, return_exceptions=True)

        for name, out in zip(names, outputs):
            results[name] = out if not isinstance(out, Exception) else {"error": str(out)}

    return results
