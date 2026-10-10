import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Forecast } from "../../types";

const axisStyle = { fill: "#929a9e", fontSize: 11, fontFamily: "DM Sans" };
const gridColor = "#edf0ee";

function moneyTick(value: number) {
  return value >= 1000 ? `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k` : `$${value}`;
}

export function UsageAreaChart({ data, compact = false }: { data: Forecast[]; compact?: boolean }) {
  return (
    <div className={`chart-wrap ${compact ? "chart-compact" : ""}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1aa879" stopOpacity={0.19} />
              <stop offset="95%" stopColor="#1aa879" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={gridColor} vertical={false} />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={axisStyle} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={axisStyle} tickFormatter={moneyTick} />
          <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, "Cost"]} contentStyle={{ border: "1px solid #e9eeeb", borderRadius: 10, fontSize: 12, boxShadow: "0 8px 30px #16251c12" }} />
          <Area type="monotone" dataKey="actual" stroke="#169b6e" strokeWidth={2.5} fill="url(#usageFill)" activeDot={{ r: 5, fill: "#169b6e", stroke: "#fff", strokeWidth: 3 }} />
          <Area type="monotone" dataKey="projected" stroke="#93d5ba" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CashFlowChart({ data }: { data: Forecast[] }) {
  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 4, left: -15, bottom: 0 }}>
          <CartesianGrid stroke={gridColor} vertical={false} />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={axisStyle} dy={9} />
          <YAxis axisLine={false} tickLine={false} tick={axisStyle} tickFormatter={moneyTick} />
          <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, ""]} contentStyle={{ border: "1px solid #e9eeeb", borderRadius: 10, fontSize: 12 }} />
          <Bar dataKey="income" name="Income" fill="#1ca879" radius={[4, 4, 0, 0]} barSize={15} />
          <Bar dataKey="expenses" name="Expenses" fill="#dcebe4" radius={[4, 4, 0, 0]} barSize={15} />
          <Line type="monotone" dataKey="expenses" name="Expenses trend" stroke="#93a9a1" strokeWidth={1.5} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
