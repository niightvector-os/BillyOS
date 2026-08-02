"use client";

export default function DownloadsPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="study-overlay">
      <div className="downloads-panel">
        <div className="study-header" style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
          <div>
            <div className="study-label">DOWNLOADS</div>
            <h2 className="study-title">Your Downloads</h2>
          </div>
          <button className="study-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="downloads-empty">
          <p>No downloads yet.</p>
          <p className="downloads-empty-sub">Saved research, study sets, and exports will appear here once that feature is built.</p>
        </div>
      </div>
    </div>
  );
}
