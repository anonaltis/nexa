import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Info, Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ComponentSpec {
  name?: string;
  value?: string;
  package?: string;
  manufacturer?: string;
  datasheet_url?: string;
  price?: number;
}

interface ComponentData {
  _id: string;
  name: string;
  category: string;
  description?: string;
  specs?: ComponentSpec;
  pinout?: Record<string, string>;
  footprint?: string;
  symbol?: string;
  tags: string[];
}

interface ComponentCardProps {
  component: ComponentData;
  onSelect?: (component: ComponentData) => void;
}

const categoryColors: Record<string, string> = {
  mcu: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  sensor: "bg-green-500/20 text-green-400 border-green-500/30",
  display: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  actuator: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  communication: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  power: "bg-red-500/20 text-red-400 border-red-500/30",
  resistor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  capacitor: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  led: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const ComponentCard = ({ component, onSelect }: ComponentCardProps) => {
  const colorClass =
    categoryColors[component.category] ||
    "bg-gray-500/20 text-gray-400 border-gray-500/30";

  return (
    <div className="blueprint-card p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-sm">{component.name}</h3>
        <Badge variant="outline" className={`text-xs ${colorClass}`}>
          {component.category}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
        {component.description}
      </p>

      {component.specs?.value && (
        <div className="text-xs font-mono text-primary mb-2">
          {component.specs.value}
        </div>
      )}

      <div className="flex flex-wrap gap-1 mb-3">
        {component.tags.slice(0, 4).map((tag) => (
          <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
            {tag}
          </Badge>
        ))}
        {component.tags.length > 4 && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            +{component.tags.length - 4}
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between">
        {component.specs?.price !== undefined && (
          <span className="text-xs text-muted-foreground">
            ${component.specs.price.toFixed(2)}
          </span>
        )}

        <div className="flex gap-1 ml-auto">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Info className="w-3.5 h-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{component.name}</DialogTitle>
                <DialogDescription>{component.description}</DialogDescription>
              </DialogHeader>

              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-4 py-4">
                  {/* Specs */}
                  {component.specs && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Specifications</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {component.specs.package && (
                          <>
                            <span className="text-muted-foreground">Package</span>
                            <span className="font-mono">{component.specs.package}</span>
                          </>
                        )}
                        {component.specs.manufacturer && (
                          <>
                            <span className="text-muted-foreground">
                              Manufacturer
                            </span>
                            <span>{component.specs.manufacturer}</span>
                          </>
                        )}
                        {component.specs.price !== undefined && (
                          <>
                            <span className="text-muted-foreground">Price</span>
                            <span>${component.specs.price.toFixed(2)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pinout */}
                  {component.pinout && Object.keys(component.pinout).length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Pinout</h4>
                      <div className="space-y-1">
                        {Object.entries(component.pinout).map(([pin, desc]) => (
                          <div
                            key={pin}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span className="font-mono text-primary w-16">
                              {pin}
                            </span>
                            <span className="text-muted-foreground">{desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {component.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Datasheet Link */}
                  {component.specs?.datasheet_url && (
                    <div>
                      <a
                        href={component.specs.datasheet_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Datasheet
                      </a>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          {onSelect && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onSelect(component)}
            >
              <Copy className="w-3 h-3 mr-1" />
              Use
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComponentCard;
