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
 *   A permanent/temporary site is shown when BOTH its district AND its sub-category are active.
 *   Sites with no sub-category are never hidden by the sub-category filter.
 *
 * @param {{ points: Array, temporarySites: Array }} params
 * @returns {{ activeFilters, toggleFilter, categoriesStructure, filteredPoints, filteredTemporarySites }}
 */

import { useState, useRef, useMemo, useEffect } from "react";
import { DISTRICTS } from "../lib/constants";

export function useFilters({ points, temporarySites }) {
  const [activeFilters, setActiveFilters] = useState([]);

  // Unique sub-categories from all permanent and temporary sites
  const allSubCategories = useMemo(() => {
    const permSubs = points.map((p) => p.subCategory);
    const tempSubs = temporarySites.map((t) => t.sub_category || t.category);
    return [...new Set([...permSubs, ...tempSubs])].filter(Boolean);
  }, [points, temporarySites]);

  // Nested structure for SideBar: { "Main Category" → ["Sub A", "Sub B", …], … }
  const categoriesStructure = useMemo(() => {
    const struct = {};
    
    // Add permanent sites categories
    points.forEach((p) => {
      const mainCat = p.category || "ללא קטגוריה";
      if (!struct[mainCat]) struct[mainCat] = new Set();
      if (p.subCategory) struct[mainCat].add(p.subCategory);
    });

    // Add temporary sites categories
    temporarySites.forEach((t) => {
      const mainCat = t.category || "ללא קטגוריה";
      if (!struct[mainCat]) struct[mainCat] = new Set();
      if (t.sub_category || t.category) struct[mainCat].add(t.sub_category || t.category);
    });

    // Always include districts as top-level filter group
    struct["רובעים"] = DISTRICTS;

    // Convert Sets to Arrays for consumption by components
    return Object.fromEntries(
      Object.entries(struct).map(([k, v]) => [k, Array.isArray(v) ? v : Array.from(v)])
    );
  }, [points, temporarySites]);

  // Track which categories have been auto-enabled so new ones (arriving via WS) get added too
  const seenCategories = useRef(new Set());
  useEffect(() => {
    if (allSubCategories.length === 0) return;
    const isFirst = seenCategories.current.size === 0;
    const newSubs = allSubCategories.filter((c) => !seenCategories.current.has(c));
    
    newSubs.forEach((c) => seenCategories.current.add(c));
    
    if (isFirst) {
      setActiveFilters([...allSubCategories, ...DISTRICTS]);
    } else if (newSubs.length > 0) {
      setActiveFilters((prev) => [...new Set([...prev, ...newSubs])]);
    }
  }, [allSubCategories]);

  /** Toggle a single filter item on or off. */
  function toggleFilter(item) {
    setActiveFilters((prev) =>
      prev.includes(item) ? prev.filter((f) => f !== item) : [...prev, item]
    );
  }

  /** Toggle all items in a group on or off. */
  function toggleGroup(items) {
    const allActive = items.every((item) => activeFilters.includes(item));
    if (allActive) {
      // Deselect all
      setActiveFilters((prev) => prev.filter((f) => !items.includes(f)));
    } else {
      // Select all
      setActiveFilters((prev) => [...new Set([...prev, ...items])]);
    }
  }

  // ---------------------------------------------------------------------------
  // Derived: filtered permanent sites
  // ---------------------------------------------------------------------------
  const filteredPoints = useMemo(() => {
    if (activeFilters.length === 0) return [];

    const activeDistricts = activeFilters.filter((f) => DISTRICTS.includes(f));
    const activeSubCats = activeFilters.filter((f) => !DISTRICTS.includes(f));

    // No districts checked → nothing to show
    if (activeDistricts.length === 0) return [];

    return points.filter((p) => {
      const districtMatch = activeDistricts.includes(p.district);
      // Sites with no sub-category are shown as long as their district is active
      const subCatMatch = !p.subCategory || activeSubCats.includes(p.subCategory);
      return districtMatch && subCatMatch;
    });
  }, [points, activeFilters]);

  // ---------------------------------------------------------------------------
  // Derived: filtered temporary sites
  // ---------------------------------------------------------------------------
  const filteredTemporarySites = useMemo(() => {
    if (activeFilters.length === 0) return [];

    const activeDistricts = activeFilters.filter((f) => DISTRICTS.includes(f));
    const activeSubCats = activeFilters.filter((f) => !DISTRICTS.includes(f));

    // No districts checked → nothing to show
    if (activeDistricts.length === 0) return [];

    return temporarySites.filter((t) => {
      const districtMatch = !t.district || activeDistricts.includes(t.district);
      const sub = t.sub_category || t.category;
      const subCatMatch = !sub || activeSubCats.includes(sub);
      return districtMatch && subCatMatch;
    });
  }, [temporarySites, activeFilters]);

  return {
    activeFilters,
    toggleFilter,
    toggleGroup,
    categoriesStructure,
    filteredPoints,
    filteredTemporarySites,
  };
}
