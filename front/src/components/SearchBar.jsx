export default function SearchBar({ query, setQuery, clear, showResults, setShowResults, results, onPick }) {
  return (
    <div className="top-search">
      <div className="search-box">
        <div className="search-input-row">
          <span style={{ opacity: 0.6 }}>🔎</span>
          <input
            className="search-input"
            placeholder="חפש נקודה בעומר..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowResults(true)}
          />
          {query && <button className="search-clear" onClick={clear}>✕</button>}
        </div>

        {showResults && results.length > 0 && (
          <div className="search-results">
            {results.map((p) => (
              <div key={p.id} className="search-item" onClick={() => onPick(p)}>
                <div className="search-item-title">{p.name}</div>
                <div className="search-item-sub">{p.address || "עומר"}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
