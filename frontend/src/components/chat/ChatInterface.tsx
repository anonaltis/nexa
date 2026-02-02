import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Bot, User, Loader2, CheckCircle2, Cpu, Code, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { ChatMessage, PollOption as PollOptionType } from "@/types/project";

interface ChatInterfaceProps {
  onPlanComplete?: (plan: any) => void;
  onGeneratePCB?: () => void;
  onGenerateCode?: () => void;
  sessionId: string | null;
  projectId?: string | null;
  onSessionCreated?: (sessionId: string) => void;
}

interface ProjectPlan {
  projectType: string;
  experienceLevel: string;
  microcontroller: string;
  features: string[];
  components: { name: string; quantity: number; purpose: string }[];
  connections: { from: string; to: string; description: string }[];
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
  onGeneratePCB,
  onGenerateCode,
  sessionId,
  projectId,
  onSessionCreated,
}: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [useReasoning, setUseReasoning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [planningPhase, setPlanningPhase] = useState<"none" | "questions" | "complete">("none");
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
        message: userMessage.content,
        session_id: currentSessionId,
        mode: "auto",
        useReasoning: useReasoning
      });

      const data = response.data;

      const aiMessage: ChatMessage = {
        id: data.id || generateUUID(),
        role: "assistant",
        content: data.content || data.response,
        timestamp: new Date(data.timestamp || Date.now()),
        metadata: data.metadata,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Check if plan is complete from AI response
      if (data.metadata?.isPlanComplete) {
        setPlanningPhase("complete");
        if (onPlanComplete && data.metadata.plan) {
          onPlanComplete(data.metadata.plan);
        }
      }
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
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
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
                <span className="text-[8px] font-bold text-primary">AI</span>
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
                            <div className="font-bold text-[10px] uppercase">
                              {option.label}
                            </div>
                            {option.description && (
                              <div className="text-[8px] text-muted-foreground mt-0.5 uppercase">
                                {option.description}
                              </div>
                            )}
                          </div>
                          {option.selected && (
                            <span className="text-[8px] font-bold uppercase text-primary">SELECTED</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

              <div className="text-[8px] font-bold uppercase text-muted-foreground mt-1 px-1">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>

            {message.role === "user" && (
              <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                <span className="text-[8px] font-bold text-muted-foreground">ME</span>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <span className="text-[8px] font-bold text-primary">AI</span>
            </div>
            <div className="chat-bubble-ai py-2 px-4 rounded-2xl">
              <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase tracking-widest animate-pulse">
                Thinking...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Action Buttons when planning is complete */}
      {planningPhase === "complete" && (
        <div className="px-4 pb-2">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={onGeneratePCB}
              variant="outline"
              size="sm"
              className="border-primary/30 hover:bg-primary/10 text-[10px] font-bold uppercase"
            >
              View PCB Diagram
            </Button>
            <Button
              onClick={onGenerateCode}
              variant="outline"
              size="sm"
              className="border-primary/30 hover:bg-primary/10 text-[10px] font-bold uppercase"
            >
              Generate Code
            </Button>
            <Button variant="outline" size="sm" className="text-[10px] font-bold uppercase">
              Export Plan
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-2 mb-2 px-1">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={useReasoning}
              onChange={(e) => setUseReasoning(e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
            />
            <span>Enable Deep Reasoning (Dual Agent Mode)</span>
          </label>
        </div>

        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="DESCRIBE YOUR PROJECT IDEA..."
            rows={1}
            className="flex-1 resize-none bg-input border border-border rounded-lg px-4 py-3 text-xs font-bold uppercase tracking-tight focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/30"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-primary hover:bg-primary/90 px-6 text-xs font-bold uppercase tracking-widest"
          >
            SEND
          </Button>
        </div>
        <p className="text-[8px] font-bold uppercase text-muted-foreground/50 mt-2 tracking-widest text-center">
          ENTER TO SEND • SHIFT+ENTER FOR NEW LINE
        </p>
      </div>
    </div >
  );
};

export default ChatInterface;
