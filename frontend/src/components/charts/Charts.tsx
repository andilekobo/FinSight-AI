import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "../../utils/currency";
import type { Forecast } from "../../types";

const axisStyle = { fill: "#929a9e", fontSize: 11, fontFamily: "DM Sans" };
const gridColor = "#edf0ee";

export function CashFlowChart({ data, currency }: { data: Forecast[]; currency?: string }) {
  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 4, left: -15, bottom: 0 }}>
          <CartesianGrid stroke={gridColor} vertical={false} />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={axisStyle} dy={9} />
          <YAxis axisLine={false} tickLine={false} tick={axisStyle} tickFormatter={(value) => currency
            ? formatCurrency(Number(value), currency, true)
            : new Intl.NumberFormat("en-ZA", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value))} />
          <Tooltip formatter={(value) => [currency
            ? formatCurrency(Number(value), currency)
            : new Intl.NumberFormat("en-ZA").format(Number(value)), ""]} contentStyle={{ border: "1px solid #e9eeeb", borderRadius: 10, fontSize: 12 }} />
          <Bar dataKey="income" name="Income" fill="#1ca879" radius={[4, 4, 0, 0]} barSize={15} />
          <Bar dataKey="expenses" name="Expenses" fill="#dcebe4" radius={[4, 4, 0, 0]} barSize={15} />
          <Line type="monotone" dataKey="expenses" name="Expenses trend" stroke="#93a9a1" strokeWidth={1.5} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
