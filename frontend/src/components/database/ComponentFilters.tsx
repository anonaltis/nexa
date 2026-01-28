import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Cpu, Zap, Monitor, Settings, Radio, BatteryCharging, CircleDot } from "lucide-react";

interface Category {
  name: string;
  count: number;
}

interface ComponentFiltersProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  mcu: <Cpu className="w-4 h-4" />,
  sensor: <Settings className="w-4 h-4" />,
  display: <Monitor className="w-4 h-4" />,
  actuator: <Zap className="w-4 h-4" />,
  communication: <Radio className="w-4 h-4" />,
  power: <BatteryCharging className="w-4 h-4" />,
  resistor: <CircleDot className="w-4 h-4" />,
  capacitor: <CircleDot className="w-4 h-4" />,
  led: <CircleDot className="w-4 h-4" />,
};

const ComponentFilters = ({
  categories,
  selectedCategory,
  onCategoryChange,
}: ComponentFiltersProps) => {
  return (
    <div className="blueprint-card p-4">
      <h3 className="text-sm font-semibold mb-3">Categories</h3>

      <ScrollArea className="h-[400px]">
        <div className="space-y-1">
          <Button
            variant={selectedCategory === null ? "secondary" : "ghost"}
            className="w-full justify-start gap-2 h-9"
            onClick={() => onCategoryChange(null)}
          >
            <CircleDot className="w-4 h-4" />
            All Components
            <Badge variant="outline" className="ml-auto text-xs">
              {categories.reduce((sum, c) => sum + c.count, 0)}
            </Badge>
          </Button>

          {categories.map((category) => (
            <Button
              key={category.name}
              variant={selectedCategory === category.name ? "secondary" : "ghost"}
              className="w-full justify-start gap-2 h-9"
              onClick={() => onCategoryChange(category.name)}
            >
              {categoryIcons[category.name] || <CircleDot className="w-4 h-4" />}
              <span className="capitalize">{category.name}</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ComponentFilters;
