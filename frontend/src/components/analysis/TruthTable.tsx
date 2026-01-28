import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface TruthTableData {
  gate_type: string;
  num_inputs: number;
  inputs: number[][];
  outputs: number[];
}

interface TruthTableProps {
  data: TruthTableData;
}

const TruthTable = ({ data }: TruthTableProps) => {
  const inputLabels = Array.from(
    { length: data.num_inputs },
    (_, i) => String.fromCharCode(65 + i) // A, B, C, D...
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-primary border-primary">
          {data.gate_type}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {data.num_inputs}-input gate
        </span>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-border">
            {inputLabels.map((label) => (
              <TableHead key={label} className="text-center w-12 font-mono">
                {label}
              </TableHead>
            ))}
            <TableHead className="text-center w-12 font-mono border-l border-border">
              Y
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.inputs.map((inputRow, rowIndex) => (
            <TableRow key={rowIndex} className="border-border">
              {inputRow.map((input, colIndex) => (
                <TableCell
                  key={colIndex}
                  className={`text-center font-mono ${
                    input === 1 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {input}
                </TableCell>
              ))}
              <TableCell
                className={`text-center font-mono font-bold border-l border-border ${
                  data.outputs[rowIndex] === 1 ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"
                }`}
              >
                {data.outputs[rowIndex]}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="text-xs text-muted-foreground">
        Boolean Expression:{" "}
        <span className="font-mono text-primary">
          Y = {inputLabels.join(` ${data.gate_type} `)}
        </span>
      </div>
    </div>
  );
};

export default TruthTable;
