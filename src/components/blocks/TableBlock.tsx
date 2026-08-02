export default function TableBlock({ data }: { data: { columns: string[]; rows: string[][] } }) {
  return (
    <div className="table-block-wrap">
      <table className="table-block">
        <thead>
          <tr>{data.columns.map((c, i) => <th key={i}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
