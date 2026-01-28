import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface BodeDataPoint {
  frequency: number;
  magnitude_db: number;
  phase_deg: number;
}

interface BodePlotProps {
  data: BodeDataPoint[];
  cutoffFrequency: number;
}

const BodePlot = ({ data, cutoffFrequency }: BodePlotProps) => {
  // Format frequency for display
  const formatFrequency = (value: number) => {
    if (value >= 1e6) return `${(value / 1e6).toFixed(0)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(0)}k`;
    return value.toFixed(0);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">Magnitude Response</div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="frequency"
              scale="log"
              domain={["dataMin", "dataMax"]}
              tickFormatter={formatFrequency}
              stroke="#64748b"
              tick={{ fontSize: 10 }}
            />
            <YAxis
              domain={[-60, 10]}
              stroke="#64748b"
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => `${v} dB`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [`${value.toFixed(2)} dB`, "Magnitude"]}
              labelFormatter={(label) => `Frequency: ${formatFrequency(label)} Hz`}
            />
            <Line
              type="monotone"
              dataKey="magnitude_db"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
            {/* Cutoff frequency marker */}
            <Line
              type="monotone"
              dataKey={() => -3}
              stroke="#ef4444"
              strokeDasharray="5 5"
              strokeWidth={1}
              dot={false}
              name="-3dB"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="text-sm font-medium">Phase Response</div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="frequency"
              scale="log"
              domain={["dataMin", "dataMax"]}
              tickFormatter={formatFrequency}
              stroke="#64748b"
              tick={{ fontSize: 10 }}
            />
            <YAxis
              domain={[-90, 0]}
              stroke="#64748b"
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => `${v}°`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [`${value.toFixed(2)}°`, "Phase"]}
              labelFormatter={(label) => `Frequency: ${formatFrequency(label)} Hz`}
            />
            <Line
              type="monotone"
              dataKey="phase_deg"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
            />
            {/* -45° marker at cutoff */}
            <Line
              type="monotone"
              dataKey={() => -45}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              strokeWidth={1}
              dot={false}
              name="-45°"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-[#ef4444]" />
          <span>-3dB Cutoff</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-[#f59e0b]" />
          <span>-45° Phase</span>
        </div>
        <div className="text-primary font-mono">
          fc = {formatFrequency(cutoffFrequency)} Hz
        </div>
      </div>
    </div>
  );
};

export default BodePlot;
