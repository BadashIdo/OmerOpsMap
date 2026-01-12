from fastmcp import Client
import os

# MCP endpoints - use environment variables for Docker, fallback to localhost
WEB_MCP_URL = os.getenv("WEB_MCP_URL", "http://localhost:3333/mcp")
MATH_MCP_URL = os.getenv("MATH_MCP_URL", "http://localhost:3334/mcp")

WEB_MCP = Client(WEB_MCP_URL, name="web-mcp")
MATH_MCP = Client(MATH_MCP_URL, name="mcp-math")
