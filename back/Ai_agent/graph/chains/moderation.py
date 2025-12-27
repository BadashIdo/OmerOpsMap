# graph/chains/moderation.py
from __future__ import annotations

import re
from typing import Literal, Optional
from dotenv import load_dotenv
load_dotenv()
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableSequence
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field

from graph.prompts.prompt_moderate import MODERATION_SYSTEM_PROMPT


# LLM
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)


class ModerationDecision(BaseModel):
    """Decision whether the user text is appropriate to process."""

    allowed: bool = Field(description="Whether the text is allowed to be processed (true/false).")
    category: Literal["ok", "profanity", "sexual", "harassment", "hate", "other"] = Field(
        description="High-level category for the decision."
    )


structured_llm_moderator = llm.with_structured_output(ModerationDecision)

system = (
    MODERATION_SYSTEM_PROMPT
)

moderation_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", system),
        ("human", "User query: {query}"),
    ]
)

# moderation_chain.invoke({"text": "<user text>"})
moderation_chain: RunnableSequence = moderation_prompt | structured_llm_moderator


# --- Quick checks (cheap, deterministic) --------------------------
PROFANITY_PATTERNS = [r"\b(fuck|shit|bitch|asshole|cunt)\b"]
SEXUAL_PATTERNS = [r"\b(porn|xxx|nude|nudes|blowjob|handjob)\b"]
HEBREW_RUDE_PATTERNS = [
    r"(?<![0-9A-Za-z\u0590-\u05FF])"
    r"(?:ו|ה|ב|ל|כ|מ|ש|כש|מש|שב|וכש|וה|וב|ול|וכ|ומ|ושה|שה)?"
    r"(זין|כוס|כוסית|שרמוטה|מזדיין|זונה|חרא|מטומטם|מפגר)"
    r"(?![0-9A-Za-z\u0590-\u05FF])"
]

COMPILED_PATTERNS = [
    re.compile(p, re.IGNORECASE)
    for p in (PROFANITY_PATTERNS + SEXUAL_PATTERNS + HEBREW_RUDE_PATTERNS)
]


def quick_block_reason(text: str) -> Optional[str]:
    for pat in COMPILED_PATTERNS:
        if pat.search(text):
            return f"Matched pattern: {pat.pattern}"
    return None
