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

  // AI Recommendation State
  const [aiPrompt, setAiPrompt] = useState("");
  const [isRecommending, setIsRecommending] = useState(false);
  const [recommendationReasoning, setRecommendationReasoning] = useState<string | null>(null);

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

  const handleAIRecommend = async () => {
    if (!aiPrompt.trim() || isRecommending) return;

    setIsRecommending(true);
    setRecommendationReasoning(null);
    try {
      // Calls the chat-v3 orchestrator which knows how to handle component requests
      const response = await api.post("/api/v3/chat/message", {
        message: `Recommend a component for: ${aiPrompt}`,
        context: "components",
        use_reasoning: true
      });

      const data = response.data;
      setRecommendationReasoning(data.content || data.response);
      toast.success("AI_RECOMMENDATION_SYNCED");
    } catch (error) {
      console.error("Recommendation failed:", error);
      toast.error("NEURAL_LINK_FAILURE");
    } finally {
      setIsRecommending(false);
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
          {/* Filters Sidebar (3/12) */}
          <div className="lg:col-span-3 space-y-8">
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

            <div className="blueprint-card p-6 border-primary/20 bg-primary/5 space-y-6">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                AI_Smart_Recommender
              </h4>
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    placeholder="E.g. High precision op-amp for audio..."
                    className="w-full h-24 bg-black/40 border border-primary/10 rounded p-3 text-[10px] font-bold uppercase tracking-widest focus:border-primary/40 focus:outline-none resize-none placeholder:opacity-20"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                  />
                  <Button
                    className="absolute bottom-2 right-2 h-7 px-3 bg-primary hover:bg-primary/90 text-[8px] font-black uppercase tracking-widest"
                    onClick={handleAIRecommend}
                    disabled={isRecommending || !aiPrompt.trim()}
                  >
                    {isRecommending ? "Processing..." : "Search"}
                  </Button>
                </div>

                {recommendationReasoning && (
                  <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 mb-2 text-primary">
                      <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-[8px] font-black uppercase tracking-[0.2em]">Engineering_Logic</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground leading-relaxed font-bold uppercase tracking-tight">
                      {recommendationReasoning}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="blueprint-card p-6 border-primary/20 bg-primary/5 space-y-6">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                System_Metrics
              </h4>
              <div className="space-y-4">
                {[
                  { label: "LATENCY", val: "12MS" },
                  { label: "INDEX", val: "EL_CORE_V4" },
                  { label: "SECURITY", val: "ENCRYPTED" }
                ].map(spec => (
                  <div key={spec.label} className="flex justify-between items-center border-b border-primary/5 pb-2">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">{spec.label}</span>
                    <span className="text-[10px] font-mono font-bold text-primary">{spec.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content (9/12) */}
          <div className="lg:col-span-9 space-y-8">
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

            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="h-0.5 w-3 bg-primary/40" />
                  <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Query_Results</h2>
                </div>
                <span className="text-[8px] font-mono text-primary font-bold uppercase tracking-widest bg-primary/5 px-2 py-0.5 border border-primary/10">BUFFER_AUTO_SYNC: ON</span>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-6 blueprint-card border-primary/10 bg-primary/[0.02]">
                  <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Establishing_Database_Uplink...</span>
                </div>
              ) : components.length === 0 ? (
                <div className="text-center py-32 blueprint-card border-dashed border-primary/20 bg-primary/5">
                  <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Zero_Results_Found</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-60 max-w-xs mx-auto mb-8">
                    The requested identifier does not exist in the current registry buffer.
                  </p>
                  <Button onClick={seedDatabase} className="h-10 px-8 bg-primary hover:bg-primary/90 text-[10px] font-black uppercase tracking-widest rounded-none">
                    Re-Initialize_Registry
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-450px)]">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pr-4 pb-12">
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
