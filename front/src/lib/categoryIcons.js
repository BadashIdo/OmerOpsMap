// מיפוי קטגוריות ראשיות ל-Material Icons
export const categoryIconMap = {
  "תפעול": "build",                    // מפתח ברגים
  "רובעים": "location_city",          // בניינים/עיר
  "חירום": "emergency",                // חירום
  "חינוך": "school",                   // בית ספר
  "ספורט ופנאי": "sports_soccer",      // ספורט
  "תחבורה": "directions_bus",          // תחבורה ציבורית
  "תשתיות": "construction",            // בנייה/תשתיות
  "סביבה": "eco",                      // סביבה
  "קהילה": "groups",                   // אנשים/קהילה
  "ללא קטגוריה": "help_outline",      // סימן שאלה
};

// ברירת מחדל אם קטגוריה לא נמצאה
export const defaultCategoryIcon = "folder";

/**
 * מחזירה את שם האייקון המתאים לקטגוריה
 * @param {string} categoryName - שם הקטגוריה הראשית
 * @returns {string} - שם האייקון מ-Material Symbols
 */
export function getCategoryIcon(categoryName) {
  return categoryIconMap[categoryName] || defaultCategoryIcon;
}

