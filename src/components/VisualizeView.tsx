"use client";

import { useState } from "react";
import InlineMap from "@/components/InlineMap";
import { BarChartBlock, LineChartBlock, PieChartBlock } from "@/components/blocks/ChartBlock";
import TimelineBlock from "@/components/blocks/TimelineBlock";
import ComparisonCardsBlock from "@/components/blocks/ComparisonCardsBlock";
import TableBlock from "@/components/blocks/TableBlock";
import TripPlanBlock from "@/components/blocks/TripPlanBlock";
import type { Location } from "@/components/InlineMap";
import { z } from "zod";
import { BarChartData, LineChartData, PieChartData, TimelineData, ComparisonCardsData, TableData, TripPlanData } from "@/lib/visualize-schema";

type ImagesBlockData = { images: { url: string; pageUrl: string; title: string }[] };
type VideoBlockData = { videos: { id: string; title: string }[] };
type MapBlockData = { locations: Location[] };

export type VisualizeEntry = {
  question: string;
  summary: string;
  needs_live_research: boolean;
  researchFailed?: boolean;
  sources?: { title: string; url: string }[];
  blocks: { type: string; data: unknown }[];
};

export type VisualizeData = { entries: VisualizeEntry[] };

function VisualizeEntryView({ entry }: { entry: VisualizeEntry }) {
  return (
    <div className="visualize-entry">
      <h3 className="visualize-entry-question">{entry.question}</h3>
      <p className="study-summary">{entry.summary}</p>

      {entry.needs_live_research && entry.researchFailed && (
        <p style={{ color: "var(--ember)", fontSize: 13, marginBottom: 16 }}>
          This needed current information but the live search failed — treat details with caution.
        </p>
      )}

      {entry.blocks.length === 0 ? null : (
        <div className="visualize-blocks">
          {entry.blocks.map((block, i) => {
            switch (block.type) {
              case "bar_chart": return <BarChartBlock key={i} data={block.data as z.infer<typeof BarChartData>} />;
              case "line_chart": return <LineChartBlock key={i} data={block.data as z.infer<typeof LineChartData>} />;
              case "pie_chart": return <PieChartBlock key={i} data={block.data as z.infer<typeof PieChartData>} />;
              case "timeline": return <TimelineBlock key={i} data={block.data as z.infer<typeof TimelineData>} />;
              case "comparison_cards": return <ComparisonCardsBlock key={i} data={block.data as z.infer<typeof ComparisonCardsData>} />;
              case "table": return <TableBlock key={i} data={block.data as z.infer<typeof TableData>} />;
              case "trip_plan": return <TripPlanBlock key={i} data={block.data as z.infer<typeof TripPlanData> & { hotelUrl: string; flightUrl: string }} />;
              case "map": return <InlineMap key={i} locations={(block.data as MapBlockData).locations} />;
              case "images":
                return (
                  <div key={i} className="image-strip visualize-image-strip">
                    {(block.data as ImagesBlockData).images.map((img: { url: string; pageUrl: string; title: string }, idx: number) => (
                      <a key={idx} href={img.pageUrl} target="_blank" rel="noopener noreferrer" className="image-strip-item">
                        <img src={img.url} alt={img.title} loading="lazy" />
                        <span>{img.title}</span>
                      </a>
                    ))}
                  </div>
                );
              case "video":
                return (
                  <div key={i} className="visualize-video-embed">
                    <div className="video-embed" style={{ margin: "8px 0" }}>
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${(block.data as VideoBlockData).videos[0].id}?rel=0`}
                        title={(block.data as VideoBlockData).videos[0].title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                );
              default: return null;
            }
          })}
        </div>
      )}

      {entry.sources && entry.sources.length > 0 && (
        <div className="source-list">
          {entry.sources.map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="source-item">
              <span className="source-num">[{i + 1}]</span> {s.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function VisualizeView({
  data,
  onClose,
  onFollowUp,
  loading,
}: {
  data: VisualizeData;
  onClose: () => void;
  onFollowUp: (question: string) => void;
  loading?: boolean;
}) {
  const [followUpInput, setFollowUpInput] = useState("");
  const latest = data.entries[data.entries.length - 1];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!followUpInput.trim() || loading) return;
    onFollowUp(followUpInput);
    setFollowUpInput("");
  }

  return (
    <div className="study-overlay">
      <div className="visualize-panel">
        <div className="study-header" style={{ maxWidth: 780, margin: "0 auto", padding: "0 24px" }}>
          <div>
            <div className="study-label">◇ VISUALIZE</div>
            <h2 className="study-title">{latest.question}</h2>
          </div>
          <button className="study-close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="visualize-body">
          {data.entries.map((entry, i) => (
            <VisualizeEntryView key={i} entry={entry} />
          ))}
          {loading && <p className="thinking-text">Analyzing...</p>}
        </div>

        <form className="visualize-followup-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="auth-input"
            placeholder="Ask a follow-up in this Visualize session..."
            value={followUpInput}
            onChange={(e) => setFollowUpInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="icon-btn" aria-label="Send" disabled={loading}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
