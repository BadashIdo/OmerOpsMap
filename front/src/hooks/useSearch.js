/**
 * useSearch — scored full-text search over the currently visible sites.
 *
 * Searches both permanent and temporary sites simultaneously.
 *
 * Scoring per result:
 *   +3  name starts with the query
 *   +2  name contains the query
 *   +1  address / category / description contains the query
 *
 * Results are sorted by score descending, capped at the top 8.
 * Normalized comparison (lowercase + trim) via lib/text.normalize().
 *
 * @param {{ filteredPoints: Array, filteredTemporarySites: Array }} params
 * @returns {{ query, setQuery, showResults, setShowResults, results }}
 */

import { useState, useMemo } from "react";
import { normalize } from "../lib/text";

export function useSearch({ filteredPoints, filteredTemporarySites }) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  const results = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];

    // Score permanent sites
    const scoredPermanent = filteredPoints
      .map((p) => {
        const name = normalize(p.name);
        const address = normalize(p.address || "");
        const desc = normalize(p.description || "");
        let score = 0;
        if (name.startsWith(q)) score += 3;
        if (name.includes(q)) score += 2;
        if (address.includes(q)) score += 1;
        if (desc.includes(q)) score += 1;
        return { item: { ...p, _type: "permanent" }, score };
      })
      .filter((x) => x.score > 0);

    // Score temporary sites
    const scoredTemporary = filteredTemporarySites
      .map((t) => {
        const name = normalize(t.name);
        const desc = normalize(t.description || "");
        const category = normalize(t.category || "");
        let score = 0;
        if (name.startsWith(q)) score += 3;
        if (name.includes(q)) score += 2;
        if (category.includes(q)) score += 1;
        if (desc.includes(q)) score += 1;
        return { item: { ...t, _type: "temporary" }, score };
      })
      .filter((x) => x.score > 0);

    return [...scoredPermanent, ...scoredTemporary]
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.item);
  }, [query, filteredPoints, filteredTemporarySites]);

  return { query, setQuery, showResults, setShowResults, results };
}
