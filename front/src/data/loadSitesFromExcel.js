import * as XLSX from "xlsx";
import proj4 from "proj4";

// EPSG:2039 (Israel TM Grid / ITM)
proj4.defs(
  "EPSG:2039",
  "+proj=tmerc +lat_0=31.73439361111111 +lon_0=35.20451694444445 +k=1.0000067 +x_0=219529.584 +y_0=626907.39 +ellps=GRS80 +towgs84=-24.0024,-17.1032,-17.8444,-0.33077,-1.85269,1.66969,5.4248 +units=m +no_defs"
);

function toNumber(v) {
  const n = typeof v === "number" ? v : Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
}

function cleanStr(v) {
  const s = String(v ?? "").trim();
  return s || "";
}

/** מחזיר את הערך הראשון שקיים מתוך רשימת שמות עמודות אפשריות */
function pick(row, keys) {
  for (const k of keys) {
    const v = row?.[k];
    const s = cleanStr(v);
    if (s) return s;
  }
  return "";
}

export async function loadSitesFromExcel() {
  const res = await fetch("/sites.xlsx");
  if (!res.ok) throw new Error(`Failed to fetch /sites.xlsx (HTTP ${res.status})`);

  const buf = await res.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

  const sites = rows
    .map((r, idx) => {
      // קואורדינטות
      const y = toNumber(pick(r, ["קו אורך", "קו-אורך", "אורך", "Y"]));
      const x = toNumber(pick(r, ["קו רוחב", "קו-רוחב", "רוחב", "X"]));
      if (x == null || y == null) return null;

      const [lng, lat] = proj4("EPSG:2039", "WGS84", [x, y]);

      // שדות בסיסיים (מנסים כמה שמות כדי לא להיות תלויים באקסל)
      const name = pick(r, ["אתר", "שם אתר", "שם"]);
      const category = pick(r, ["קטגוריה", "קטגוריה ראשית"]);
      const subCategory = pick(r, ["תת קטגוריה", "תת-קטגוריה", "תת קטגוריה ", "תתקטגוריה"]);
      const type = pick(r, ["סוג אתר", "סוג"]);
      const district = pick(r, ["רובע", "רובע ", "רובע  ", "אזור", "שכונה"]);
      const street = pick(r, ["רחוב", "שם רחוב"]);
      const houseNumber = pick(r, ["מספר בית", "מספר", "בית"]);
      const phone = pick(r, ["טלפון", "טלפון ", "מספר טלפון", "נייד", "פלאפון"]);
      const contactName = pick(r, ["איש קשר", "אחראי", "אחראי/ת", "שם איש קשר", "איש קשר / אחראי"]);
      const description = pick(r, ["תאור כללי", "תיאור כללי", "תיאור", "הערות", "מידע נוסף"]);

      const address = cleanStr(`${street} ${houseNumber}`.trim());

      return {
        id: idx + 1,
        name,
        category,
        subCategory,
        type,
        district,
        street,
        houseNumber,
        address,       // מחושב (לא מהאקסל)
        contactName,   // אם קיים - יגיע, אם לא - נשאר ""
        phone,
        description,
        lat,
        lng,
      };
    })
    .filter(Boolean);

  return sites;
}
