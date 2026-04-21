from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
import io
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment

from app.database import get_db
from app.auth.jwt import get_current_admin
from app.models.admin import Admin
from app.models.permanent_site import PermanentSite
from app.models.temporary_site import TemporarySite

router = APIRouter(prefix="/api/admin/export", tags=["export"])


def _style_header_row(ws, fill_color: str):
    header_font = Font(bold=True, color="FFFFFF")
    fill = PatternFill(start_color=fill_color, end_color=fill_color, fill_type="solid")
    for cell in ws[1]:
        cell.font = header_font
        cell.fill = fill
        cell.alignment = Alignment(horizontal="center")


def _fmt(dt) -> str:
    if dt is None:
        return ""
    if hasattr(dt, "strftime"):
        return dt.strftime("%Y-%m-%d %H:%M")
    return str(dt)


def _auto_width(ws):
    for col in ws.columns:
        max_len = max((len(str(cell.value or "")) for cell in col), default=0)
        ws.column_dimensions[col[0].column_letter].width = max_len + 4


@router.get("/database")
async def export_database(
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    permanent_result = await db.execute(select(PermanentSite).order_by(PermanentSite.id))
    permanent_sites = permanent_result.scalars().all()

    temporary_result = await db.execute(select(TemporarySite).order_by(TemporarySite.id))
    temporary_sites = temporary_result.scalars().all()

    wb = openpyxl.Workbook()

    # ── Sheet 1: Permanent Sites ──────────────────────────────────────────────
    ws_perm = wb.active
    ws_perm.title = "אתרים קבועים"
    ws_perm.append([
        "ID", "שם", "קטגוריה", "תת-קטגוריה", "סוג", "שכונה/רובע",
        "רחוב", "מספר בית", "שם איש קשר", "טלפון", "תיאור",
        "קו רוחב", "קו אורך", "נוצר", "עודכן",
    ])
    _style_header_row(ws_perm, "1565C0")

    for s in permanent_sites:
        ws_perm.append([
            s.id, s.name, s.category or "", s.sub_category or "",
            s.type or "", s.district or "", s.street or "",
            s.house_number or "", s.contact_name or "", s.phone or "",
            s.description or "", s.lat, s.lng,
            _fmt(s.created_at), _fmt(s.updated_at),
        ])
    _auto_width(ws_perm)

    # ── Sheet 2: Temporary Sites ──────────────────────────────────────────────
    ws_temp = wb.create_sheet("אירועים זמניים")
    ws_temp.append([
        "ID", "שם", "קטגוריה", "תיאור", "דחיפות", "סטטוס",
        "תאריך התחלה", "תאריך סיום",
        "שם איש קשר", "טלפון",
        "קו רוחב", "קו אורך", "נוצר", "עודכן",
    ])
    _style_header_row(ws_temp, "E65100")

    for t in temporary_sites:
        ws_temp.append([
            t.id, t.name, t.category or "", t.description or "",
            t.priority.value if t.priority else "",
            t.status.value if t.status else "",
            _fmt(t.start_date), _fmt(t.end_date),
            t.contact_name or "", t.phone or "",
            t.lat, t.lng,
            _fmt(t.created_at), _fmt(t.updated_at),
        ])
    _auto_width(ws_temp)

    # ── Stream back as .xlsx ──────────────────────────────────────────────────
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"omeropsmap_export_{timestamp}.xlsx"

    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
