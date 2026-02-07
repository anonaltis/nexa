import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import ComponentCard from "@/components/database/ComponentCard";
import ComponentSearch from "@/components/database/ComponentSearch";
import ComponentFilters from "@/components/database/ComponentFilters";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Sparkles,
  Search,
  Cpu,
  Zap,
  Box,
  ChevronRight,
  Database,
  Info,
  ExternalLink,
  Plus
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { recommendComponents } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";

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

interface Category {
  name: string;
  count: number;
}

const Components = () => {
  const { user } = useAuth();
  const [components, setComponents] = useState<ComponentData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // AI Agent States
  const [aiRequirements, setAiRequirements] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<any>(null);

  const fetchComponents = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (selectedCategory) params.append("category", selectedCategory);
      params.append("limit", "50");

      const response = await api.get(`/components?${params.toString()}`);
      setComponents(response.data);
    } catch (error) {
      console.error("Failed to fetch components:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/components/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const seedDatabase = async () => {
    try {
      const response = await api.get("/components/seed");
      toast.success(response.data.message);
      fetchComponents();
      fetchCategories();
    } catch (error) {
      console.error("Failed to seed database:", error);
      toast.error("Failed to seed database");
    }
  };

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchComponents();
    }
  }, [user, searchQuery, selectedCategory]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
  };

  const handleSelectComponent = (component: ComponentData) => {
    navigator.clipboard.writeText(component.name);
    toast.success(`COPIED_${component.name.toUpperCase()}_TO_BUFFER`);
  };

  const handleAiRecommend = async () => {
    if (!aiRequirements) return;
    setIsAiLoading(true);
    try {
      const response = await recommendComponents(aiRequirements);
      setAiRecommendations(response);
      toast.success("AI_RECOMMENDATIONS_GENERATED");
    } catch (error) {
      toast.error("AI_ENGINE_FAILURE");
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container max-w-4xl mx-auto py-32 text-center space-y-8 px-4">
          <div className="inline-flex items-center justify-center p-6 border-2 border-dashed border-primary/20 bg-primary/5 rounded-full mb-4">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Access_Restricted</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em]">AUTHENTICATION_LOG_REQUIRED_FOR_REGISTRY_ACCESS</p>
          <Button asChild className="h-12 px-12 bg-primary hover:bg-primary/90 text-[10px] font-black uppercase tracking-[0.3em] rounded-none shadow-[0_4px_20px_rgba(var(--primary-rgb),0.2)]">
            <Link to="/login">Initialize_Login_Protocol</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-7xl mx-auto px-4 py-12 space-y-8">
        {/* Header Module */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 p-6 blueprint-card border-primary/20 bg-primary/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-1 opacity-10">
            <span className="text-[8px] font-mono font-bold tracking-[0.5em] uppercase">COMPONENT_REGISTRY_v4.1</span>
          </div>
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <h1 className="text-3xl font-bold tracking-tighter uppercase">Component Registry</h1>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] ml-5">
              Secure_Database_Access: Standard_Operator_Level_01
            </p>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={seedDatabase}
              className="h-10 px-6 border-primary/20 hover:bg-primary/10 text-[10px] font-bold uppercase tracking-widest rounded-none hidden md:flex"
            >
              Sync_Registry
            </Button>
            <div className="h-10 w-px bg-primary/20 hidden md:block" />
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Active_Units</span>
              <span className="text-xs font-bold text-primary uppercase">{components.length} Items</span>
            </div>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar (3/12) - Filters & AI Agent */}
          <div className="lg:col-span-3 space-y-8 flex flex-col h-full overflow-y-auto custom-scrollbar">
            {/* AI Recommendation Agent */}
            <div className="blueprint-card p-6 border-primary/30 bg-primary/5 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-1 opacity-10">
                <Sparkles className="h-20 w-20 text-primary rotate-12" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Neural_Agent</h4>
                </div>
                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                  Specify your project goals for intelligent part recommendations.
                </p>
                <div className="space-y-3">
                  <Input
                    placeholder="e.g. 5V LDO with high PSRR"
                    className="h-9 bg-black/40 border-primary/20 text-[10px] focus-visible:ring-primary/20"
                    value={aiRequirements}
                    onChange={(e) => setAiRequirements(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiRecommend()}
                  />
                  <Button
                    onClick={handleAiRecommend}
                    disabled={isAiLoading || !aiRequirements}
                    className="w-full h-8 bg-primary hover:bg-primary/90 text-[8px] font-black uppercase tracking-widest rounded-none"
                  >
                    {isAiLoading ? "Processing..." : "Generate_Recommendations"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <span className="h-0.5 w-3 bg-primary/40" />
                <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Logic_Filters</h2>
              </div>
              <ComponentFilters
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
              />
            </div>
          </div>

          {/* Main Content (9/12) */}
          <div className="lg:col-span-9 space-y-8 h-full flex flex-col min-h-0">
            {/* AI Agent Results (Conditional) */}
            {aiRecommendations && (
              <div className="blueprint-card border-primary/20 bg-primary/[0.02] p-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center justify-between border-b border-primary/10 pb-4">
                  <div className="flex items-center gap-3">
                    <Zap className="h-4 w-4 text-primary" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-primary">Intelligent_Recommendations</h3>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setAiRecommendations(null)} className="h-6 w-6 opacity-40 hover:opacity-100">
                    <ChevronRight className="h-4 w-4 rotate-90" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {aiRecommendations.recommendations?.map((part: any, idx: number) => (
                      <div key={idx} className="blueprint-card p-4 border-white/5 bg-black/40 relative group hover:border-primary/20 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-black text-primary">{part.name}</span>
                          <Badge className="bg-primary/20 text-primary text-[7px] border-none uppercase h-4">{part.category}</Badge>
                        </div>
                        <p className="text-[9px] text-muted-foreground mb-3 leading-relaxed opacity-60">
                          {part.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(part.specs || {}).map(([key, val]: any) => (
                            <span key={key} className="text-[7px] font-mono bg-white/5 px-1.5 py-0.5 text-muted-foreground/80 lowercase border border-white/5">{key}: {val}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-6 blueprint-card border-primary/10 bg-black/20 font-mono text-[9px] text-muted-foreground/80 leading-relaxed overflow-y-auto h-48 custom-scrollbar">
                    <div className="flex items-center gap-2 text-primary mb-3">
                      <Info className="h-3 w-3" />
                      <span className="font-black uppercase tracking-widest">Design_Integration_Notes</span>
                    </div>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {aiRecommendations.design_notes}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <span className="h-0.5 w-4 bg-primary/40" />
                <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Registry_Query</h2>
              </div>
              <ComponentSearch
                onSearch={handleSearch}
                placeholder="QUERY_BY_IDENTIFIER_OR_SPECIFICATION..."
              />
            </div>

            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="h-0.5 w-3 bg-primary/40" />
                  <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Query_Results</h2>
                </div>
                <div className="flex gap-4">
                  <span className="text-[8px] font-mono text-primary font-bold uppercase tracking-widest bg-primary/5 px-2 py-0.5 border border-primary/10">BUFFER_AUTO_SYNC: ON</span>
                </div>
              </div>

              {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-6 blueprint-card border-primary/10 bg-primary/[0.02]">
                  <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Establishing_Database_Uplink...</span>
                </div>
              ) : components.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-32 blueprint-card border-dashed border-primary/20 bg-primary/5">
                  <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Zero_Results_Found</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-60 max-w-xs mx-auto mb-8 text-center">
                    The requested identifier does not exist in the current registry buffer.
                  </p>
                  <Button onClick={seedDatabase} className="h-10 px-8 bg-primary hover:bg-primary/90 text-[10px] font-black uppercase tracking-widest rounded-none">
                    Re-Initialize_Registry
                  </Button>
                </div>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 pr-4 pb-12">
                    {components.map((component) => (
                      <ComponentCard
                        key={component._id}
                        component={component}
                        onSelect={handleSelectComponent}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Components;
