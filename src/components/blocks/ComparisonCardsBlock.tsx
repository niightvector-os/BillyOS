export default function ComparisonCardsBlock({ data }: { data: { items: { title: string; facts: { label: string; value: string }[] }[] } }) {
  return (
    <div className="comparison-grid">
      {data.items.map((item, i) => (
        <div key={i} className="comparison-card">
          <div className="comparison-card-title">{item.title}</div>
          {item.facts.map((f, j) => (
            <div key={j} className="comparison-fact">
              <span className="comparison-fact-label">{f.label}</span>
              <span className="comparison-fact-value">{f.value}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
