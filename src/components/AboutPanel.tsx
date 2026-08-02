export default function AboutPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="study-overlay">
      <div className="downloads-panel">
        <div className="study-header" style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
          <div>
            <div className="study-label">ABOUT</div>
            <h2 className="study-title">BillyOS</h2>
          </div>
          <button className="study-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
          <p className="study-summary">
            BillyOS is an AI environment designed to build the experience around your answer —
            bringing research, visualization, maps, video, and study tools together in one intelligent workspace.
          </p>
          <h3 className="study-subhead">Version</h3>
          <p style={{ fontSize: 13.5, color: "var(--text-mid)" }}>v1 — Core intelligence, research, and visualization</p>
          <h3 className="study-subhead">Credit</h3>
          <p style={{ fontSize: 13.5, color: "var(--text-mid)" }}>BillyOS by Billy Nandy</p>
          <p style={{ fontSize: 13.5, color: "var(--text-mid)" }}>Guidance & Direction by Ahmed Ghazi</p>
        </div>
      </div>
    </div>
  );
}
