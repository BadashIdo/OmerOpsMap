# graph/agents/tool_router.py
from __future__ import annotations

from graph.chains.tool_router import router_chain


def decide_tools(query: str) -> dict:
    # default fallback 
    fallback = {"use_web": False, "use_math": False}

    try:
        decision = router_chain.invoke({"query": query})
        # decision הוא ToolDecision (Pydantic)
        return {
            "use_web": bool(getattr(decision, "use_web", False)),
            "use_math": bool(getattr(decision, "use_math", False)),
        }
    except Exception:
        return fallback
