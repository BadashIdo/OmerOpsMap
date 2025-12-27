from fastmcp import FastMCP

mcp = FastMCP("mcp-math")

@mcp.tool
def add(a: int, b: int) -> int:
    return a + b

if __name__ == "__main__":
    mcp.run(transport="http", host="0.0.0.0", port=3334)
