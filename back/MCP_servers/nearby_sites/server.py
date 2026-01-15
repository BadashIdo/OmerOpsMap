"""
MCP Server for finding nearby sites in Omer
Returns the N closest permanent/temporary sites to a given location
"""
from __future__ import annotations
import os
import math
import httpx
from fastmcp import FastMCP

# Data Server URL - use Docker network or localhost
DATA_SERVER_URL = os.getenv("DATA_SERVER_URL", "http://localhost:8001")

mcp = FastMCP("nearby-sites")


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the distance between two points on Earth using Haversine formula.
    Returns distance in kilometers.
    """
    R = 6371  # Earth's radius in km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c


@mcp.tool
def get_nearby_sites(
    user_lat: float = None,
    user_lng: float = None,
    count: int = 8,
    include_temporary: bool = True,
    categories: list[str] = None,
    name_search: str = None
) -> str:
    """
    מוצא אתרים לפי קטגוריה, שם ו/או קרבה למיקום המשתמש.
    
    Args:
        user_lat: קו רוחב של המשתמש (אופציונלי)
        user_lng: קו אורך של המשתמש (אופציונלי)
        count: מספר האתרים להחזיר (ברירת מחדל: 8)
        include_temporary: האם לכלול אירועים זמניים (ברירת מחדל: כן)
        categories: רשימת קטגוריות לסינון (אופציונלי)
        name_search: חיפוש לפי שם מקום ספציפי (אופציונלי)
    
    Returns:
        רשימת האתרים (עם מרחק אם יש מיקום, בלי מרחק אם אין)
    """
    try:
        has_location = user_lat is not None and user_lng is not None
        has_categories = categories and len(categories) > 0
        has_name_search = name_search and len(name_search) > 0
        
        # 🚫 No location AND no categories AND no name search = need location for "what's near me" queries
        if not has_location and not has_categories and not has_name_search:
            return "📍 כדי לחפש מה יש בקרבתך, יש להפעיל שיתוף מיקום.\n\nלחץ על כפתור המיקום (🎯) בצד ימין של המפה כדי להפעיל מעקב מיקום, ואז נסה שוב."
        
        sites = []
        categories_lower = [c.lower() for c in categories] if categories else None
        name_search_lower = name_search.lower() if name_search else None
        
        def word_matches_search(word: str, search: str) -> bool:
            """Check if a word matches the search term with up to 1 extra char at start/end.
            Examples for search 'אטד':
            - 'אטד' → True (exact)
            - 'האטד' → True (1 char prefix)
            - 'אטדה' → True (1 char suffix)
            - 'אטדים' → False (2+ chars difference)
            """
            word = word.lower()
            # Exact match
            if word == search:
                return True
            # Allow 1 extra char at start OR end, but not both
            len_diff = len(word) - len(search)
            if len_diff == 1:
                # Check if word is search + 1 char at end
                if word.startswith(search):
                    return True
                # Check if word is 1 char + search at start
                if word.endswith(search):
                    return True
            return False
        
        def name_contains_search(site_name: str, search: str) -> bool:
            """Check if any word in site name matches the search term."""
            if not site_name or not search:
                return False
            # Split name into words and check each
            words = site_name.lower().split()
            return any(word_matches_search(word, search) for word in words)
        
        def matches_filter(site_category: str, site_sub_category: str = None, site_name: str = None) -> bool:
            """Check if site matches category and/or name filters"""
            # If we have a name search, check if name contains the search term (word-based)
            if name_search_lower:
                name_match = name_contains_search(site_name, name_search_lower)
                # If there are also categories, match either name OR category
                if has_categories:
                    cat_match = any(
                        cat in field.lower()
                        for field in [site_category or "", site_sub_category or "", site_name or ""]
                        for cat in categories_lower
                    )
                    return name_match or cat_match
                return name_match
            
            # No name search - just check categories
            if not categories_lower:
                return True
            check_fields = [site_category or "", site_sub_category or "", site_name or ""]
            return any(
                cat in field.lower() 
                for field in check_fields 
                for cat in categories_lower
            )
        
        # Get permanent sites
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(f"{DATA_SERVER_URL}/api/permanent-sites")
            if resp.status_code == 200:
                permanent_sites = resp.json()
                for site in permanent_sites:
                    if site.get("lat") and site.get("lng"):
                        # Filter by category and/or name if provided
                        if not matches_filter(
                            site.get("category"),
                            site.get("sub_category"),
                            site.get("name")
                        ):
                            continue
                        
                        # Calculate distance only if location is available
                        distance = None
                        if has_location:
                            distance = haversine_distance(
                                user_lat, user_lng,
                                site["lat"], site["lng"]
                            )
                        
                        sites.append({
                            "type": "permanent",
                            "id": site.get("id"),
                            "name": site.get("name", "ללא שם"),
                            "category": site.get("category", ""),
                            "sub_category": site.get("sub_category", ""),
                            "address": f"{site.get('street', '')} {site.get('house_number', '')}".strip(),
                            "phone": site.get("phone", ""),
                            "distance_km": round(distance, 2) if distance is not None else None,
                            "lat": site["lat"],
                            "lng": site["lng"]
                        })
            
            # Get temporary sites if requested
            if include_temporary:
                resp = client.get(f"{DATA_SERVER_URL}/api/temporary-sites")
                if resp.status_code == 200:
                    temp_sites = resp.json()
                    for site in temp_sites:
                        if site.get("lat") and site.get("lng"):
                            # Filter by category and/or name if provided
                            if not matches_filter(site.get("category"), None, site.get("name")):
                                continue
                            
                            # Calculate distance only if location is available
                            distance = None
                            if has_location:
                                distance = haversine_distance(
                                    user_lat, user_lng,
                                    site["lat"], site["lng"]
                                )
                            
                            sites.append({
                                "type": "temporary",
                                "id": site.get("id"),
                                "name": site.get("name", "ללא שם"),
                                "category": site.get("category", "אירוע"),
                                "description": site.get("description", ""),
                                "priority": site.get("priority", ""),
                                "distance_km": round(distance, 2) if distance is not None else None,
                                "lat": site["lat"],
                                "lng": site["lng"]
                            })
        
        # Sort by distance (if available) and take top N
        if has_location:
            sites.sort(key=lambda x: x["distance_km"] if x["distance_km"] is not None else float("inf"))
        closest = sites[:count]
        
        if not closest:
            if name_search:
                return f"לא נמצאו אתרים עם השם '{name_search}'"
            if categories:
                return f"לא נמצאו אתרים בקטגוריות: {', '.join(categories)}"
            return "לא נמצאו אתרים במערכת"
        
        # Format output based on search type and location
        if has_name_search:
            result = f"🔍 נמצאו {len(closest)} אתרים עם '{name_search}':\n\n"
        elif has_location:
            if categories:
                result = f"🗺️ {len(closest)} האתרים הקרובים ({', '.join(categories)}):\n\n"
            else:
                result = f"🗺️ {len(closest)} האתרים הקרובים למיקום שלך:\n\n"
        else:
            result = f"🗺️ נמצאו {len(closest)} אתרים ({', '.join(categories)}):\n\n"
        
        if not has_location and (has_categories or has_name_search):
            result += "💡 הפעל שיתוף מיקום (🎯) כדי לראות מרחקים\n\n"
        
        for i, site in enumerate(closest, 1):
            emoji = "📍" if site["type"] == "permanent" else "⚠️"
            result += f"{i}. {emoji} **{site['name']}**\n"
            result += f"   קטגוריה: {site['category']}\n"
            if site.get("distance_km") is not None:
                result += f"   מרחק: {site['distance_km']} ק\"מ\n"
            if site.get("address"):
                result += f"   כתובת: {site['address']}\n"
            if site.get("phone"):
                result += f"   טלפון: {site['phone']}\n"
            if site.get("description"):
                result += f"   תיאור: {site['description'][:100]}...\n"
            result += "\n"
        
        return result
        
    except Exception as e:
        return f"שגיאה בחיפוש אתרים: {str(e)}"


@mcp.tool
def search_sites_by_category(
    category: str,
    user_lat: float = None,
    user_lng: float = None,
    count: int = 10
) -> str:
    """
    מחפש אתרים לפי קטגוריה.
    
    Args:
        category: קטגוריה לחיפוש (למשל: חינוך, בריאות, ספורט)
        user_lat: קו רוחב של המשתמש (אופציונלי - למיון לפי מרחק)
        user_lng: קו אורך של המשתמש (אופציונלי)
        count: מספר התוצאות להחזיר
    
    Returns:
        רשימת אתרים מהקטגוריה
    """
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(f"{DATA_SERVER_URL}/api/permanent-sites")
            if resp.status_code != 200:
                return "שגיאה בטעינת אתרים"
            
            all_sites = resp.json()
        
        # Filter by category (case-insensitive partial match)
        category_lower = category.lower()
        filtered = [
            s for s in all_sites
            if category_lower in (s.get("category") or "").lower() or
               category_lower in (s.get("sub_category") or "").lower() or
               category_lower in (s.get("name") or "").lower()
        ]
        
        if not filtered:
            return f"לא נמצאו אתרים בקטגוריה '{category}'"
        
        # Calculate distances if location provided
        if user_lat and user_lng:
            for site in filtered:
                if site.get("lat") and site.get("lng"):
                    site["distance_km"] = round(
                        haversine_distance(user_lat, user_lng, site["lat"], site["lng"]),
                        2
                    )
            filtered.sort(key=lambda x: x.get("distance_km", float("inf")))
        
        # Take top N
        results = filtered[:count]
        
        result = f"🔍 נמצאו {len(filtered)} אתרים בקטגוריה '{category}':\n\n"
        
        for i, site in enumerate(results, 1):
            result += f"{i}. **{site.get('name', 'ללא שם')}**\n"
            if site.get("category"):
                result += f"   קטגוריה: {site['category']}\n"
            if site.get("street"):
                result += f"   כתובת: {site.get('street', '')} {site.get('house_number', '')}\n"
            if site.get("phone"):
                result += f"   טלפון: {site['phone']}\n"
            if site.get("distance_km"):
                result += f"   מרחק: {site['distance_km']} ק\"מ\n"
            result += "\n"
        
        return result
        
    except Exception as e:
        return f"שגיאה בחיפוש: {str(e)}"


if __name__ == "__main__":
    mcp.run(transport="http", host="0.0.0.0", port=3335)
