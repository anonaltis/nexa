import Layout from "@/components/layout/Layout";
import ChatInterface from "@/components/chat/ChatInterface";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowLeft, FileText, Cpu, Code } from "lucide-react";

const ChatPage = () => {
  const { user } = useAuth();

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
        {/* Sidebar */}
        <div className="w-64 border-r border-border bg-card/50 p-4 hidden lg:block">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <h3 className="text-sm font-semibold mb-4">New Project</h3>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 text-primary">
              <MessageSquare className="w-4 h-4" />
              <span>Planning Chat</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg opacity-50">
              <FileText className="w-4 h-4" />
              <span>Documentation</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg opacity-50">
              <Cpu className="w-4 h-4" />
              <span>PCB Design</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg opacity-50">
              <Code className="w-4 h-4" />
              <span>Code Generation</span>
            </div>
          </div>

          <div className="mt-8 p-4 blueprint-card">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">TIPS</h4>
            <ul className="text-xs text-muted-foreground space-y-2">
              <li>• Be specific about your requirements</li>
              <li>• Mention any constraints (size, power)</li>
              <li>• Share your experience level</li>
              <li>• Ask questions anytime!</li>
            </ul>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <ChatInterface />
        </div>
      </div>
    </Layout>
  );
};

export default ChatPage;
