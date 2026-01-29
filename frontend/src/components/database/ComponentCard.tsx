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

const ComponentCard = ({ component, onSelect }: ComponentCardProps) => {
  return (
    <div className="blueprint-card p-0 border-primary/10 bg-background/50 hover:border-primary/40 transition-all group overflow-hidden">
      {/* Visual Header */}
      <div className="bg-primary/10 px-4 py-2 border-b border-primary/20 flex items-center justify-between">
        <span className="text-[7px] font-mono text-primary/40 uppercase font-bold tracking-widest">ID:_{component._id.substring(0, 8).toUpperCase()}</span>
        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest bg-primary/5 text-primary/80 border-primary/20 rounded-none h-5">
          {component.category}
        </Badge>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h3 className="font-black text-xs uppercase tracking-wider group-hover:text-primary transition-colors leading-tight mb-1">{component.name}</h3>
          <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest line-clamp-2 opacity-50 mb-3 leading-relaxed">
            {component.description}
          </p>
        </div>

        {component.specs?.value && (
          <div className="text-[10px] font-mono font-bold text-primary bg-primary/5 px-2 py-1 inline-block border border-primary/10">
            {component.specs.value}
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {component.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[7px] font-bold uppercase tracking-widest px-1.5 py-0.5 border border-primary/5 text-muted-foreground opacity-40">
              {tag}
            </span>
          ))}
          {component.tags.length > 3 && (
            <span className="text-[7px] font-bold uppercase tracking-widest px-1.5 py-0.5 border border-primary/5 text-muted-foreground opacity-40">
              +{component.tags.length - 3}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-primary/5">
          {component.specs?.price !== undefined ? (
            <span className="text-[9px] font-mono font-bold text-muted-foreground/60">
              UNIT_COST: ${component.specs.price.toFixed(2)}
            </span>
          ) : (
            <span className="text-[9px] font-mono font-bold text-muted-foreground/30">COST_NA</span>
          )}

          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <button className="h-7 px-3 bg-primary/5 hover:bg-primary/10 border border-primary/10 text-[9px] font-bold uppercase tracking-widest transition-all">
                  INFO
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-card border-primary/20 rounded-none">
                <DialogHeader className="border-b border-primary/10 pb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span className="text-[9px] font-bold text-primary uppercase tracking-[0.3em]">Component_Data_Sheet</span>
                  </div>
                  <DialogTitle className="text-2xl font-black uppercase tracking-tighter">{component.name}</DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">{component.description}</DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh]">
                  <div className="space-y-8 py-8">
                    {/* Specs Grid */}
                    {component.specs && (
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Technical_Spec_Matrix</h4>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          {[
                            { label: "PACKAGE", val: component.specs.package },
                            { label: "MANUFACTURER", val: component.specs.manufacturer },
                            { label: "PRICE", val: component.specs.price ? `$${component.specs.price.toFixed(2)}` : "N/A" },
                            { label: "AVAILABILITY", val: "IN_STOCK" }
                          ].map(item => (
                            <div key={item.label} className="blueprint-card p-4 border-primary/10 bg-primary/[0.02]">
                              <div className="text-[7px] font-bold text-muted-foreground uppercase mb-1">{item.label}</div>
                              <div className="text-[10px] font-mono font-bold uppercase truncate">{item.val || "BUFFERING"}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pinout Module */}
                    {component.pinout && Object.keys(component.pinout).length > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Pinout_Registry</h4>
                        <div className="grid gap-2">
                          {Object.entries(component.pinout).map(([pin, desc]) => (
                            <div key={pin} className="flex items-center justify-between px-4 py-2 border border-primary/5 bg-primary/[0.01]">
                              <span className="font-mono text-primary font-bold text-[10px]">{pin}</span>
                              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Meta Section */}
                    <div className="flex flex-wrap gap-2 pt-4">
                      {component.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-primary/5 border border-primary/10 text-[8px] font-bold uppercase tracking-widest text-primary/60">{tag}</span>
                      ))}
                    </div>

                    {component.specs?.datasheet_url && (
                      <div className="pt-4">
                        <Button asChild className="w-full h-12 bg-primary hover:bg-primary/90 text-[10px] font-black uppercase tracking-[0.3em] rounded-none">
                          <a href={component.specs.datasheet_url} target="_blank" rel="noopener noreferrer">
                            ESTABLISH_DATASHEET_LINK
                          </a>
                        </Button>
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
                className="h-7 text-[9px] font-black uppercase tracking-widest rounded-none border-primary/20 hover:bg-primary hover:text-white transition-all"
                onClick={() => onSelect(component)}
              >
                DEPLOY
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentCard;
