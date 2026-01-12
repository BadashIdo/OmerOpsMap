from __future__ import annotations
import os
from dotenv import load_dotenv
from tavily import TavilyClient
from fastmcp import FastMCP

load_dotenv()
mcp = FastMCP("web-mcp")

def _client():
    key = os.getenv("TAVILY_API_KEY")
    if not key:
        raise RuntimeError("Missing TAVILY_API_KEY")
    return TavilyClient(api_key=key)

@mcp.tool
def web_search(query: str, max_results: int = 2) -> str:
    res = _client().search(query=query, max_results=max_results)
    results = res.get("results", []) if isinstance(res, dict) else res
    return "\n\n".join(
        f"{i+1}. {r.get('title','')}\n{r.get('url','')}\n{(r.get('content','') or '')[:300]}"
        for i, r in enumerate(results)
    ) or "No results"

if __name__ == "__main__":
    mcp.run(transport="http", host="0.0.0.0", port=3333)
