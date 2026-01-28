import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Database, Loader2, RefreshCw, Package } from "lucide-react";
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
    toast.success(`Copied "${component.name}" to clipboard`);
  };

  if (!user) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Login to Access Component Database</h1>
          <Button asChild>
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Database className="w-6 h-6 text-primary" />
              Component Database
            </h1>
            <p className="text-muted-foreground">
              Browse and search electronic components
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={seedDatabase}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Seed Database
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <ComponentSearch
            onSearch={handleSearch}
            placeholder="Search by name, description, or tags..."
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <ComponentFilters
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
            />
          </div>

          {/* Components Grid */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {isLoading ? (
                  "Loading..."
                ) : (
                  <>
                    Showing {components.length} component
                    {components.length !== 1 ? "s" : ""}
                    {selectedCategory && ` in ${selectedCategory}`}
                    {searchQuery && ` matching "${searchQuery}"`}
                  </>
                )}
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : components.length === 0 ? (
              <div className="text-center py-20 blueprint-card">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Components Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || selectedCategory
                    ? "Try adjusting your search or filters"
                    : "Click 'Seed Database' to add initial components"}
                </p>
                {!searchQuery && !selectedCategory && (
                  <Button onClick={seedDatabase} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Seed Database
                  </Button>
                )}
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pr-4">
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
    </Layout>
  );
};

export default Components;
