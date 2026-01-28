import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Thermometer, Zap, Activity } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PowerData {
  input_voltage: number;
  output_voltage: number;
  output_current: number;
  power_input: number;
  power_output: number;
  power_dissipation: number;
  efficiency: number;
  thermal_resistance?: number;
  temperature_rise?: number;
  junction_temperature?: number;
  regulator_type: string;
}

interface PowerAnalysisProps {
  data: PowerData;
}

const PowerAnalysis = ({ data }: PowerAnalysisProps) => {
  const efficiencyColor =
    data.efficiency > 80
      ? "text-green-400"
      : data.efficiency > 50
      ? "text-yellow-400"
      : "text-red-400";

  const tempWarning = data.junction_temperature && data.junction_temperature > 85;
  const tempCritical = data.junction_temperature && data.junction_temperature > 125;

  return (
    <div className="space-y-4">
      {/* Power Flow Diagram */}
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        <div className="text-center">
          <div className="text-xs text-muted-foreground">Input</div>
          <div className="text-lg font-mono text-primary">{data.input_voltage}V</div>
          <div className="text-xs text-muted-foreground">
            {data.power_input.toFixed(2)}W
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full h-2 bg-muted rounded-full relative">
            <div
              className="absolute left-0 top-0 h-full bg-primary rounded-full"
              style={{ width: `${data.efficiency}%` }}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-mono bg-background px-2">
              {data.regulator_type}
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-xs text-muted-foreground">Output</div>
          <div className="text-lg font-mono text-green-400">{data.output_voltage}V</div>
          <div className="text-xs text-muted-foreground">
            {data.power_output.toFixed(2)}W
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Zap className="w-3 h-3" />
            Efficiency
          </div>
          <div className={`text-xl font-mono ${efficiencyColor}`}>
            {data.efficiency.toFixed(1)}%
          </div>
          <Progress value={data.efficiency} className="h-1 mt-2" />
        </div>

        <div className="p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Activity className="w-3 h-3" />
            Power Loss
          </div>
          <div className="text-xl font-mono text-orange-400">
            {data.power_dissipation.toFixed(2)}W
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Heat dissipation
          </div>
        </div>

        <div className="p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Thermometer className="w-3 h-3" />
            Junction Temp
          </div>
          <div
            className={`text-xl font-mono ${
              tempCritical
                ? "text-red-400"
                : tempWarning
                ? "text-yellow-400"
                : "text-green-400"
            }`}
          >
            {data.junction_temperature?.toFixed(0) ?? "N/A"}°C
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Rise: +{data.temperature_rise?.toFixed(0) ?? 0}°C
          </div>
        </div>

        <div className="p-3 bg-muted/30 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Output Current</div>
          <div className="text-xl font-mono text-blue-400">
            {(data.output_current * 1000).toFixed(0)}mA
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            @ {data.output_voltage}V
          </div>
        </div>
      </div>

      {/* Warnings */}
      {tempCritical && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Junction temperature exceeds safe limits! Add a heatsink or reduce load
            current.
          </AlertDescription>
        </Alert>
      )}

      {tempWarning && !tempCritical && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Junction temperature is elevated. Consider adding thermal management.
          </AlertDescription>
        </Alert>
      )}

      {data.efficiency < 50 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Low efficiency ({data.efficiency.toFixed(1)}%). Consider using a switching
            regulator for better efficiency.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PowerAnalysis;
