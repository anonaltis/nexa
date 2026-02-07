import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

interface WaveformViewerProps {
    data: Record<string, any[]>;
}

const WaveformViewer = ({ data }: WaveformViewerProps) => {
    if (!data || Object.keys(data).length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30">
                <p className="text-[10px] font-bold uppercase tracking-widest">No_Data_Available</p>
            </div>
        );
    }

    // Determine if it's transient or AC by looking at the first key's data
    const firstKey = Object.keys(data)[0];
    const samplePoint = data[firstKey][0];
    const isTransient = samplePoint && 'time' in samplePoint;
    const isAC = samplePoint && 'frequency' in samplePoint;

    const xAxisKey = isTransient ? "time" : (isAC ? "frequency" : "step");
    const xAxisLabel = isTransient ? "Time (s)" : (isAC ? "Frequency (Hz)" : "Step");
    const yAxisLabel = isTransient ? "Voltage (V) / Current (A)" : (isAC ? "Magnitude (dB)" : "Value");

    // Colors for multiple traces
    const colors = ["#8b5cf6", "#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

    return (
        <div className="w-full h-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis
                        dataKey={xAxisKey}
                        name={xAxisLabel}
                        type="number"
                        domain={['auto', 'auto']}
                        scale={isAC ? "log" : "linear"}
                        stroke="#666"
                        label={{ value: xAxisLabel, position: 'insideBottomRight', offset: -10, fill: '#666', fontSize: 10 }}
                        tick={{ fontSize: 10, fill: '#666' }}
                    />
                    <YAxis
                        stroke="#666"
                        label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: '#666', fontSize: 10 }}
                        tick={{ fontSize: 10, fill: '#666' }}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", fontSize: "10px" }}
                        itemStyle={{ color: "#fff" }}
                    />
                    <Legend wrapperStyle={{ paddingTop: "20px", fontSize: "10px" }} />
                    {Object.keys(data).map((node, index) => (
                        <Line
                            key={node}
                            type="monotone"
                            data={data[node]}
                            dataKey={isTransient ? "voltage" : (isAC ? "magnitude_db" : "voltage")}
                            name={node}
                            stroke={colors[index % colors.length]}
                            strokeWidth={2}
                            dot={false}
                            animationDuration={1000}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default WaveformViewer;
