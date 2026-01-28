import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import ChatInterface from "@/components/chat/ChatInterface";
import ChatHistorySidebar from "@/components/chat/ChatHistorySidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare, Menu, X } from "lucide-react";

const ChatPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    searchParams.get("session")
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Sync URL with session ID
  useEffect(() => {
    if (currentSessionId) {
      setSearchParams({ session: currentSessionId });
    } else {
      setSearchParams({});
    }
  }, [currentSessionId, setSearchParams]);

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const handleNewSession = () => {
    setCurrentSessionId(null);
  };

  const handleSessionCreated = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  if (!user) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Login to Start Planning</h1>
          <p className="text-muted-foreground mb-6">
            Create an account to use the AI project planner
          </p>
          <Button asChild>
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideFooter fullWidth>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Mobile Sidebar Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden fixed top-20 left-4 z-50 bg-card border border-border"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? (
            <X className="w-4 h-4" />
          ) : (
            <Menu className="w-4 h-4" />
          )}
        </Button>

        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 transition-transform duration-300 fixed lg:relative z-40 h-full`}
        >
          <ChatHistorySidebar
            currentSessionId={currentSessionId}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
          />
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <ChatInterface
            sessionId={currentSessionId}
            onSessionCreated={handleSessionCreated}
          />
        </div>
      </div>
    </Layout>
  );
};

export default ChatPage;
