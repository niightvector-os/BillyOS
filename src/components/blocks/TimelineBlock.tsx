export default function TimelineBlock({ data }: { data: { events: { date: string; label: string; description: string }[] } }) {
  return (
    <div className="timeline-block">
      {data.events.map((e, i) => (
        <div key={i} className="timeline-item">
          <div className="timeline-dot" />
          <div className="timeline-content">
            <div className="timeline-date">{e.date}</div>
            <div className="timeline-label">{e.label}</div>
            <div className="timeline-desc">{e.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
