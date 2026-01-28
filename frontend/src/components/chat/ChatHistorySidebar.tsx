import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  Plus,
  Trash2,
  MoreVertical,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatSessionSummary {
  _id: string;
  title: string;
  project_id?: string;
  message_count: number;
  created_at: string;
  updated_at: string;
  preview: string;
}

interface ChatHistorySidebarProps {
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
}

const ChatHistorySidebar = ({
  currentSessionId,
  onSelectSession,
  onNewSession,
}: ChatHistorySidebarProps) => {
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      const response = await api.get("/chat/sessions");
      setSessions(response.data);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;

    try {
      await api.delete(`/chat/sessions/${sessionToDelete}`);
      setSessions((prev) => prev.filter((s) => s._id !== sessionToDelete));

      // If we deleted the current session, create a new one
      if (sessionToDelete === currentSessionId) {
        onNewSession();
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    } finally {
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-64 border-r border-border bg-card/50 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <Button
          onClick={onNewSession}
          className="w-full bg-primary hover:bg-primary/90 gap-2"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No chat history yet
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session._id}
                className={`group relative flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                  currentSessionId === session._id
                    ? "bg-primary/20 text-primary"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => onSelectSession(session._id)}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {session.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(session.updated_at)} - {session.message_count}{" "}
                    messages
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSessionToDelete(session._id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Tips Section */}
      <div className="p-4 border-t border-border">
        <div className="p-3 rounded-lg bg-muted/30">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">
            TIPS
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>- Be specific about requirements</li>
            <li>- Mention constraints (size, power)</li>
            <li>- Share your experience level</li>
          </ul>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat Session</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this chat session and all its
              messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChatHistorySidebar;
