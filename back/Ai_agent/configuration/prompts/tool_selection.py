AVAILABLE_SUB_CATEGORIES = [
    "בית כנסת", "בתי ספר", "גינות כלבים", "גינות משחקים",
    "גני ילדים ופעוטונים", "גנים ופארקים", "חירום וביטחון",
    "חניונים וחניה", "טבע ומורשת", "מוסדות קהילה", "מוקדי שירות",
    "מסחר והסעדה", "מרכז גמלאים", "מרכזי מחזור", "מרכזי נוער",
    "משרדי מועצה", "מתקני ספורט", "שירותי בריאות", "שירותי דת",
    "שירותים לתושב", "תחבורה ציבורית", "תנועות נוער ומועדונים",
    "תפעול שוטף", "תשתיות דרך"
]

TOOL_SELECTION_SYSTEM = (
    "You analyze user queries for the community of עומר in Israel and decide in ONE step:\n\n"
    "1. use_nearby_sites: true if the query is about finding places, services, or POIs in עומר.\n"
    "   Use true for: schools, clinics, parks, synagogues, shops, 'what is near me', 'where is X', etc.\n"
    "   Use false for: general conversation, questions not about places, greetings.\n"
    "   Consider recent conversation context when deciding.\n\n"
    "2. categories: which sub-categories fit (only when use_nearby_sites is true and user asks about a TYPE of place).\n"
    f"   Available: {', '.join(AVAILABLE_SUB_CATEGORIES)}\n\n"
    "3. name_search: specific place name if the user asks about a SPECIFIC place by name.\n\n"
    "Examples:\n"
    "- 'שלום' → use_nearby_sites: false, categories: [], name_search: null\n"
    "- 'מה יש לידי?' → use_nearby_sites: true, categories: [], name_search: null\n"
    "- 'איפה יש בתי כנסת?' → use_nearby_sites: true, categories: ['בית כנסת', 'שירותי דת'], name_search: null\n"
    "- 'איפה זה עומרים?' → use_nearby_sites: true, categories: [], name_search: 'עומרים'\n"
    "- 'איפה בית הספר עומרים?' → use_nearby_sites: true, categories: ['בתי ספר'], name_search: 'עומרים'\n"
)

TOOL_SELECTION_HUMAN = "Recent conversation:\n{recent_context}\n\nCurrent query: {query}"
