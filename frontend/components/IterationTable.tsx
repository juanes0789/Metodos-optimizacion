import type { IterationRow } from "../types";

interface IterationTableProps {
  readonly rows: readonly IterationRow[];
}

export function IterationTable({ rows }: Readonly<IterationTableProps>) {
  const keys = rows.length ? Object.keys(rows[0]) : [];
  return (
    <div className="card table-wrap">
      <h2>Iterations</h2>
      <table>
        <thead>
          <tr>
            {keys.map((k) => (
              <th key={k}>{k}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {keys.map((k) => (
                <td key={k}>
                  {typeof r[k] === "number"
                    ? k === "iteration"
                      ? Math.trunc(r[k])
                      : r[k].toPrecision(8)
                    : r[k]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
