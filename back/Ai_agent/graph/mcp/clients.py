from fastmcp import Client
import os

# MCP endpoint - use environment variable for Docker, fallback to localhost
NEARBY_SITES_MCP_URL = os.getenv("NEARBY_SITES_MCP_URL", "http://localhost:3335/mcp")

NEARBY_SITES_MCP = Client(NEARBY_SITES_MCP_URL)