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
    "   Base your decision primarily on the current query. Use recent context only to resolve ambiguity.\n\n"
    "2. use_recent_sites: true ONLY if the query is about what is NEW or RECENTLY ADDED in עומר.\n"
    "   Use true for: 'מה חדש', 'מה נוסף לאחרונה', 'מה התווסף', 'מה עודכן לאחרונה'.\n"
    "   use_nearby_sites and use_recent_sites can both be true at the same time.\n\n"
    "3. categories: which sub-categories fit (only when use_nearby_sites or use_recent_sites is true and user asks about a TYPE of place).\n"
    f"   Available: {', '.join(AVAILABLE_SUB_CATEGORIES)}\n\n"
    "4. name_search: specific place name if the user asks about a SPECIFIC place by name.\n\n"
    "5. sites_count: how many results to return. Extract the number if the user specifies one.\n"
    "   Examples: 'תן לי 2' → 2, 'הראה 3 תוצאות' → 3, 'תן לי רשימה' → 5 (default).\n\n"
    "Examples:\n"
    "- 'שלום' → use_nearby_sites: false, use_recent_sites: false, categories: [], name_search: null, sites_count: 5\n"
    "- 'מה יש לידי?' → use_nearby_sites: true, use_recent_sites: false, categories: [], name_search: null, sites_count: 5\n"
    "- 'איפה יש בתי כנסת?' → use_nearby_sites: true, categories: ['בית כנסת', 'שירותי דת'], name_search: null, sites_count: 5\n"
    "- 'תן לי 2 מקומות עם השם חצב' → use_nearby_sites: true, categories: [], name_search: 'חצב', sites_count: 2\n"
    "- 'מה חדש בעומר?' → use_nearby_sites: false, use_recent_sites: true, categories: [], name_search: null, sites_count: 5\n"
    "- 'הראה לי 3 גני משחקים' → use_nearby_sites: true, categories: ['גינות משחקים'], name_search: null, sites_count: 3\n"
)

TOOL_SELECTION_HUMAN = "Recent conversation:\n{recent_context}\n\nCurrent query: {query}"
