/**
 * useFilters — manages sidebar filter state and derives filtered site lists.
 *
 * Owns:
 *  - activeFilters        : the set of currently enabled sub-categories, districts,
 *                           and temporary-event categories.
 *  - categoriesStructure  : nested { mainCategory → [subCategory, …] } map consumed
 *                           by the SideBar component.
 *  - filteredPoints       : permanent sites that pass the current filter selection.
 *  - filteredTemporarySites: temporary sites that pass the current filter selection.
 *
 * Default state: all filters ON ("show everything") — set automatically when data
 * first arrives from the API.
 *
 * Filter logic (AND):
 *   A permanent site is shown when BOTH its district AND its sub-category are active.
 *   Sites with no sub-category are never hidden by the sub-category filter.
 *   Temporary sites are hidden entirely when "אירועים זמניים" is toggled off.
 *
 * @param {{ points: Array, temporarySites: Array }} params
 * @returns {{ activeFilters, toggleFilter, categoriesStructure, filteredPoints, filteredTemporarySites }}
 */

import { useState, useRef, useMemo, useEffect } from "react";
import { DISTRICTS } from "../lib/constants";

export function useFilters({ points, temporarySites }) {
  const [activeFilters, setActiveFilters] = useState([]);

  // Unique sub-categories from all permanent sites
  const allSubCategories = useMemo(
    () => [...new Set(points.map((p) => p.subCategory))].filter(Boolean),
    [points]
  );

  // Unique categories from all temporary sites
  const allTempCategories = useMemo(
    () => [...new Set(temporarySites.map((t) => t.category))].filter(Boolean),
    [temporarySites]
  );

  // Nested structure for SideBar: { "Main Category" → ["Sub A", "Sub B", …], … }
  const categoriesStructure = useMemo(() => {
    const struct = {};
    points.forEach((p) => {
      const mainCat = p.category || "ללא קטגוריה";
      if (!struct[mainCat]) struct[mainCat] = new Set();
      if (p.subCategory) struct[mainCat].add(p.subCategory);
    });

    // Always include districts and temporary events as top-level filter groups
    struct["רובעים"] = DISTRICTS;
    if (allTempCategories.length > 0) {
      struct["אירועים זמניים"] = allTempCategories;
    }

    // Convert Sets to Arrays for consumption by components
    return Object.fromEntries(
      Object.entries(struct).map(([k, v]) => [k, Array.isArray(v) ? v : Array.from(v)])
    );
  }, [points, allTempCategories]);

  // Track which categories have been auto-enabled so new ones (arriving via WS) get added too
  const seenCategories = useRef(new Set());
  useEffect(() => {
    if (allSubCategories.length === 0) return;
    const isFirst = seenCategories.current.size === 0;
    const newSubs = allSubCategories.filter((c) => !seenCategories.current.has(c));
    const newTemps = allTempCategories.filter((c) => !seenCategories.current.has(c));
    [...newSubs, ...newTemps].forEach((c) => seenCategories.current.add(c));
    if (isFirst) {
      setActiveFilters([...allSubCategories, ...DISTRICTS, ...allTempCategories, "אירועים זמניים"]);
    } else if (newSubs.length > 0 || newTemps.length > 0) {
      setActiveFilters((prev) => [...new Set([...prev, ...newSubs, ...newTemps])]);
    }
  }, [allSubCategories, allTempCategories]);

  /** Toggle a single filter item on or off. */
  function toggleFilter(item) {
    setActiveFilters((prev) =>
      prev.includes(item) ? prev.filter((f) => f !== item) : [...prev, item]
    );
  }

  // ---------------------------------------------------------------------------
  // Derived: filtered permanent sites
  // ---------------------------------------------------------------------------
  const filteredPoints = useMemo(() => {
    if (activeFilters.length === 0) return [];

    const activeDistricts = activeFilters.filter((f) => DISTRICTS.includes(f));
    const activeSubCats = activeFilters.filter(
      (f) => !DISTRICTS.includes(f) && !allTempCategories.includes(f) && f !== "אירועים זמניים"
    );

    // No districts checked → nothing to show
    if (activeDistricts.length === 0) return [];

    return points.filter((p) => {
      const districtMatch = activeDistricts.includes(p.district);
      // Sites with no sub-category are shown as long as their district is active
      const subCatMatch = !p.subCategory || activeSubCats.includes(p.subCategory);
      return districtMatch && subCatMatch;
    });
  }, [points, activeFilters, allTempCategories]);

  // ---------------------------------------------------------------------------
  // Derived: filtered temporary sites
  // ---------------------------------------------------------------------------
  const filteredTemporarySites = useMemo(() => {
    if (activeFilters.length === 0) return [];

    // Top-level toggle: if "אירועים זמניים" is off, hide all temp sites
    if (!activeFilters.includes("אירועים זמניים")) return [];

    const activeTempCats = activeFilters.filter((f) => allTempCategories.includes(f));
    // If no specific temp category is selected, show all of them
    if (activeTempCats.length === 0) return temporarySites;

    return temporarySites.filter((t) => activeTempCats.includes(t.category));
  }, [temporarySites, activeFilters, allTempCategories]);

  return {
    activeFilters,
    toggleFilter,
    categoriesStructure,
    filteredPoints,
    filteredTemporarySites,
  };
}
