"""
Import sites from Excel file to PostgreSQL database
"""
import asyncio
import sys
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

import openpyxl
from pyproj import Transformer
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.permanent_site import PermanentSite
from app.config import get_settings

# No need for manual EPSG definitions, pyproj has them built-in

def to_number(v):
    """Convert value to number, return None if invalid"""
    try:
        if isinstance(v, (int, float)):
            return float(v)
        if v is None or str(v).strip() == "":
            return None
        n = float(str(v).strip())
        return n if not (n != n) else None  # Check for NaN
    except (ValueError, TypeError):
        return None

def clean_str(v):
    """Clean string value"""
    if v is None:
        return ""
    s = str(v).strip()
    return s if s else ""

def pick(row, keys):
    """Return first non-empty value from list of possible column names"""
    for k in keys:
        if k in row and row[k]:
            s = clean_str(row[k])
            if s:
                return s
    return ""

def transform_coordinates(x, y):
    """Transform ITM (EPSG:2039) coordinates to WGS84 (lat, lng)"""
    if x is None or y is None:
        return None, None
    
    # Use pyproj to transform from ITM to WGS84
    transformer = Transformer.from_crs("EPSG:2039", "EPSG:4326", always_xy=True)
    lng, lat = transformer.transform(x, y)
    return lat, lng

async def import_sites_from_excel(excel_path: str):
    """Import sites from Excel file to database"""
    
    # Load Excel file
    print(f"📖 Reading Excel file: {excel_path}")
    wb = openpyxl.load_workbook(excel_path, data_only=True)
    ws = wb.active
    
    # Get headers from first row
    headers = []
    for cell in ws[1]:
        headers.append(cell.value)
    
    print(f"📋 Found columns: {headers}")
    
    # Read all rows
    rows = []
    for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
        row_dict = {}
        for idx, value in enumerate(row):
            if idx < len(headers):
                row_dict[headers[idx]] = value
        rows.append(row_dict)
    
    print(f"📊 Found {len(rows)} rows in Excel")
    
    # Transform to PermanentSite objects
    sites_to_create = []
    skipped = 0
    
    for idx, r in enumerate(rows, start=1):
        # Get coordinates
        y = to_number(pick(r, ["קו אורך", "קו-אורך", "אורך", "Y"]))
        x = to_number(pick(r, ["קו רוחב", "קו-רוחב", "רוחב", "X"]))
        
        if x is None or y is None:
            print(f"⚠️  Row {idx}: Missing coordinates, skipping")
            skipped += 1
            continue
        
        # Transform coordinates
        lat, lng = transform_coordinates(x, y)
        
        if lat is None or lng is None:
            print(f"⚠️  Row {idx}: Invalid coordinates ({x}, {y}), skipping")
            skipped += 1
            continue
        
        # Get other fields
        name = pick(r, ["אתר", "שם אתר", "שם"])
        if not name:
            print(f"⚠️  Row {idx}: Missing name, skipping")
            skipped += 1
            continue
        
        category = pick(r, ["קטגוריה", "קטגוריה ראשית"])
        sub_category = pick(r, ["תת קטגוריה", "תת-קטגוריה", "תת קטגוריה ", "תתקטגוריה"])
        site_type = pick(r, ["סוג אתר", "סוג"])
        district = pick(r, ["רובע", "רובע ", "רובע  ", "אזור", "שכונה"])
        street = pick(r, ["רחוב", "שם רחוב"])
        house_number = pick(r, ["מספר בית", "מספר", "בית"])
        phone = pick(r, ["טלפון איש קשר", "טלפון ", "מספר טלפון", "נייד", "פלאפון"])
        contact_name = pick(r, ["איש קשר", "אחראי", "אחראי/ת", "שם איש קשר", "איש קשר / אחראי"])
        description = pick(r, ["תאור כללי", "תיאור כללי", "תיאור", "הערות", "מידע נוסף"])
        
        site = PermanentSite(
            name=name,
            category=category or None,
            sub_category=sub_category or None,
            type=site_type or None,
            district=district or None,
            street=street or None,
            house_number=house_number or None,
            contact_name=contact_name or None,
            phone=phone or None,
            description=description or None,
            lat=lat,
            lng=lng
        )
        
        sites_to_create.append(site)
    
    print(f"✅ Prepared {len(sites_to_create)} sites for import")
    print(f"⚠️  Skipped {skipped} rows")
    
    # Insert into database
    async with AsyncSessionLocal() as session:
        # Check if sites already exist
        result = await session.execute(select(PermanentSite))
        existing_sites = result.scalars().all()
        
        if existing_sites:
            print(f"⚠️  Database already has {len(existing_sites)} sites")
            response = input("Do you want to delete existing sites and reimport? (yes/no): ")
            if response.lower() == 'yes':
                for site in existing_sites:
                    await session.delete(site)
                await session.commit()
                print("🗑️  Deleted existing sites")
            else:
                print("❌ Import cancelled")
                return
        
        # Add new sites
        session.add_all(sites_to_create)
        await session.commit()
        
        print(f"✅ Successfully imported {len(sites_to_create)} sites!")

async def main():
    # Excel file path - copied to /app/sites.xlsx
    excel_path = Path("/app/sites.xlsx")
    
    if not excel_path.exists():
        print(f"❌ Excel file not found: {excel_path}")
        print("Please copy sites.xlsx to the container first:")
        print("docker cp front/public/sites.xlsx omeropsmap_data_server:/app/sites.xlsx")
        return
    
    await import_sites_from_excel(str(excel_path))

if __name__ == "__main__":
    asyncio.run(main())

