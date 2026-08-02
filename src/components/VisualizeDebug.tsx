"use client";

export default function VisualizeDebug({
  question,
  data,
  onClose,
}: {
  question: string;
  data: {
    summary: string;
    needs_live_research: boolean;
    research_query?: string;
    sources?: { title: string; url: string }[];
    researchFailed?: boolean;
    blocks: { type: string; reason: string }[];
  };
  onClose: () => void;
}) {
  return (
    <div className="study-overlay">
      <div className="study-panel">
        <div className="study-header">
          <div>
            <div className="study-label">VISUALIZE — ROUTER TEST</div>
            <h2 className="study-title">{question}</h2>
          </div>
          <button className="study-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="study-summary">{data.summary}</p>

        <h3 className="study-subhead">Live research</h3>
        {data.needs_live_research ? (
          <div>
            <p style={{ fontSize: 13.5, color: "var(--accent)", marginBottom: 8 }}>
              Flagged as needing current information — query: "{data.research_query}"
            </p>
            {data.researchFailed && (
              <p style={{ fontSize: 13, color: "var(--ember)" }}>Research fetch failed.</p>
            )}
            {data.sources && data.sources.length > 0 && (
              <div className="source-list" style={{ borderTop: "none", paddingTop: 0 }}>
                {data.sources.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="source-item">
                    <span className="source-num">[{i + 1}]</span> {s.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: "var(--text-dim)", fontSize: 14 }}>Not flagged — treated as stable knowledge.</p>
        )}

        <h3 className="study-subhead">Chosen blocks ({data.blocks.length})</h3>
        {data.blocks.length === 0 ? (
          <p style={{ color: "var(--text-dim)", fontSize: 14 }}>None — text_only was the right call here.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.blocks.map((b, i) => (
              <div key={i} className="map-list-item">
                <span className="map-list-name">{b.type}</span>
                <span className="map-list-desc">{b.reason}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
