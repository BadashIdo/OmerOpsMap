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
    user_lat: float,
    user_lng: float,
    count: int = 5,
    include_temporary: bool = True,
    category: str = None
) -> str:
    """
    מוצא את האתרים הקרובים ביותר למיקום המשתמש.
    אם מציינים קטגוריה, מסנן לפי קטגוריה.
    
    Args:
        user_lat: קו רוחב של המשתמש
        user_lng: קו אורך של המשתמש
        count: מספר האתרים להחזיר (ברירת מחדל: 5)
        include_temporary: האם לכלול אירועים זמניים (ברירת מחדל: כן)
        category: קטגוריה לסינון (אופציונלי) - למשל: חינוך, בריאות, ספורט, גן ילדים
    
    Returns:
        רשימת האתרים הקרובים עם מרחק בק"מ
    """
    try:
        sites = []
        category_lower = category.lower() if category else None
        
        def matches_category(site_category: str, site_sub_category: str = None, site_name: str = None) -> bool:
            """Check if site matches the category filter"""
            if not category_lower:
                return True
            check_fields = [site_category or "", site_sub_category or "", site_name or ""]
            return any(category_lower in field.lower() for field in check_fields)
        
        # Get permanent sites
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(f"{DATA_SERVER_URL}/api/permanent-sites")
            if resp.status_code == 200:
                permanent_sites = resp.json()
                for site in permanent_sites:
                    if site.get("lat") and site.get("lng"):
                        # Filter by category if provided
                        if not matches_category(
                            site.get("category"),
                            site.get("sub_category"),
                            site.get("name")
                        ):
                            continue
                            
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
                            "distance_km": round(distance, 2),
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
                            # Filter by category if provided
                            if not matches_category(site.get("category"), None, site.get("name")):
                                continue
                                
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
                                "distance_km": round(distance, 2),
                                "lat": site["lat"],
                                "lng": site["lng"]
                            })
        
        # Sort by distance and take top N
        sites.sort(key=lambda x: x["distance_km"])
        closest = sites[:count]
        
        if not closest:
            if category:
                return f"לא נמצאו אתרים בקטגוריה '{category}'"
            return "לא נמצאו אתרים במערכת"
        
        # Format output
        if category:
            result = f"🗺️ {len(closest)} האתרים הקרובים מקטגוריית '{category}':\n\n"
        else:
            result = f"🗺️ {len(closest)} האתרים הקרובים למיקום שלך:\n\n"
        
        for i, site in enumerate(closest, 1):
            emoji = "📍" if site["type"] == "permanent" else "⚠️"
            result += f"{i}. {emoji} **{site['name']}**\n"
            result += f"   קטגוריה: {site['category']}\n"
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
