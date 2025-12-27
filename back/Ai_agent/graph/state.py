from __future__ import annotations
from typing import List, Optional, TypedDict

class GraphState(TypedDict, total=False):
    """
    Represents the state of our graph.

    Attributes:
        question: question (str)
        context_window: context window - history of user conversation (str)

        answer: between Agent (str)
        final_answer: final answer to user (str)

        is_allowed: whether the question passed moderation (Bool)
        moderation_reason: reason for moderation decision (str)
        
    """

    # Input
    query: str
    context_window: str
    self_location: Optional[str]

    # Outputs
    answer: str
    final_answer: str

    # Moderation
    is_allowed: bool
    moderation_reason: str
    
    # tool agent
    tool_results: Optional[dict]