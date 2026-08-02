"use client";

import { useState } from "react";

type Video = { id: string; title: string; channel: string; thumbnail: string };

export default function VideoView({
  topic,
  videos,
  onClose,
}: {
  topic: string;
  videos: Video[];
  onClose: () => void;
}) {
  const [active, setActive] = useState(0);
  const current = videos[active];

  return (
    <div className="study-overlay">
      <div className="video-panel">
        <div className="study-header" style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
          <div>
            <div className="study-label">EXPLAIN WITH VIDEO</div>
            <h2 className="study-title">{topic}</h2>
          </div>
          <button className="study-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="video-embed">
          <iframe
            key={current.id}
            src={`https://www.youtube-nocookie.com/embed/${current.id}?rel=0`}
            title={current.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <p className="video-current-title">{current.title} — {current.channel}</p>

        {videos.length > 1 && (
          <div className="video-list">
            {videos.map((v, i) => (
              <button
                key={v.id}
                className={`video-list-item ${i === active ? "active" : ""}`}
                onClick={() => setActive(i)}
              >
                <img src={v.thumbnail} alt={v.title} />
                <span>{v.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
