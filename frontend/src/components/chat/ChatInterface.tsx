import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Bot, User, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { ChatMessage, PollOption } from "@/types/project";

interface ChatInterfaceProps {
  onPlanComplete?: (plan: any) => void;
  sessionId: string | null;
  onSessionCreated?: (sessionId: string) => void;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Welcome to ElectroLab! I'm your AI project assistant.\n\nDescribe your electronics project idea, and I'll help you:\n- Plan the components and connections\n- Generate PCB diagrams\n- Write code for ESP32/Arduino\n- Troubleshoot issues\n\nWhat would you like to build?",
  timestamp: new Date(),
};

const ChatInterface = ({
  onPlanComplete,
  sessionId,
  onSessionCreated,
}: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load session messages when sessionId changes
  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId) {
        setMessages([WELCOME_MESSAGE]);
        return;
      }

      setIsLoadingSession(true);
      try {
        const response = await api.get(`/chat/sessions/${sessionId}`);
        const sessionData = response.data;

        if (sessionData.messages && sessionData.messages.length > 0) {
          setMessages(
            sessionData.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            }))
          );
        } else {
          setMessages([WELCOME_MESSAGE]);
        }
      } catch (error) {
        console.error("Failed to load session:", error);
        setMessages([WELCOME_MESSAGE]);
      } finally {
        setIsLoadingSession(false);
      }
    };

    loadSession();
  }, [sessionId]);

  const createSessionIfNeeded = async (): Promise<string | null> => {
    if (sessionId) return sessionId;

    try {
      const response = await api.post("/chat/sessions", {
        title: "New Chat",
      });
      const newSessionId = response.data._id;
      onSessionCreated?.(newSessionId);
      return newSessionId;
    } catch (error) {
      console.error("Failed to create session:", error);
      return null;
    }
  };

  // Simple UUID generator fallback
  const generateUUID = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Create session if first message
      const currentSessionId = await createSessionIfNeeded();

      // Use V3 Endpoint
      const response = await api.post("/v3/chat/message", {
        message: userMessage.content, // V3 expects 'message', not 'content'
        session_id: currentSessionId, // V3 expects 'session_id', not 'sessionId'
        mode: "auto"
      });

      const data = response.data;

      const aiMessage: ChatMessage = {
        id: generateUUID(), // Backend V3 might not return ID in same format, so generate one
        role: "assistant",
        content: data.response, // V3 returns 'response'
        timestamp: new Date(),
        metadata: data.metadata,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: ChatMessage = {
        id: generateUUID(),
        role: "assistant",
        content:
          "Sorry, I encountered an error connecting to the server. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePollSelect = async (messageId: string, optionId: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId && msg.metadata?.pollOptions) {
          return {
            ...msg,
            metadata: {
              ...msg.metadata,
              selectedOption: optionId,
              pollOptions: msg.metadata.pollOptions.map((opt) => ({
                ...opt,
                selected: opt.id === optionId,
              })),
            },
          };
        }
        return msg;
      })
    );

    // Auto-send selected option as user message
    const selectedOption = messages
      .find((m) => m.id === messageId)
      ?.metadata?.pollOptions?.find((o) => o.id === optionId);

    if (selectedOption) {
      setInput(selectedOption.label);
      setTimeout(() => {
        handleSend();
      }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoadingSession) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-2">
          Loading conversation...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"
              }`}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}

            <div
              className={`max-w-[80%] ${message.role === "user" ? "order-first" : ""
                }`}
            >
              <div
                className={`p-4 rounded-2xl ${message.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"
                  }`}
              >
                <div className="text-sm prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:p-2 prose-pre:rounded-lg prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground text-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Poll Options */}
              {message.metadata?.type === "poll" &&
                message.metadata.pollOptions && (
                  <div className="mt-3 space-y-2">
                    {message.metadata.pollOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handlePollSelect(message.id, option.id)}
                        disabled={!!message.metadata?.selectedOption}
                        className={`w-full p-3 rounded-lg border text-left transition-all ${option.selected
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-border bg-card hover:border-primary/50 hover:bg-card/80"
                          } ${message.metadata?.selectedOption
                            ? "cursor-default"
                            : "cursor-pointer"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">
                              {option.label}
                            </div>
                            {option.description && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {option.description}
                              </div>
                            )}
                          </div>
                          {option.selected && (
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

              <div className="text-xs text-muted-foreground mt-1 px-1">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>

            {message.role === "user" && (
              <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="chat-bubble-ai p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your project idea..."
            rows={1}
            className="flex-1 resize-none bg-input border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-primary hover:bg-primary/90 px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
