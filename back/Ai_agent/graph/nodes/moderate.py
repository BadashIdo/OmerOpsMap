# graph/nodes/moderate.py
from __future__ import annotations

from typing import Dict

from graph.chains.moderation import moderation_chain, quick_block_reason

DEFAULT_BLOCK_MESSAGE = (
    "מצטער, אני לא יכול לעזור עם תוכן שמכיל שפה פוגענית/מינית/מטרידה.\n"
    "אם תרצה, נסח מחדש בצורה מכבדת או ספר לי מה המטרה הכללית ואנסה לעזור."
)

def moderate(state: Dict) -> Dict:
    query = (state.get("query") or "").strip()

    qb = quick_block_reason(query)
    if qb is not None:
        return {
            "is_allowed": False,
            "moderation_reason": qb,
            "final_answer": DEFAULT_BLOCK_MESSAGE,
        }

    decision = moderation_chain.invoke({"query": query})

    if not decision.allowed:
        return {
            "is_allowed": False,
            "moderation_reason": f"{decision.category}",
            "final_answer": DEFAULT_BLOCK_MESSAGE,
        }

    if decision.category != "ok":
        print(f"The moderation reason is: {decision.category} but need to be 'ok'")
    return {
        "is_allowed": True,
        "moderation_reason": "ok",
        "query": query,
        "context_window": state.get("context_window", ""),
    }
