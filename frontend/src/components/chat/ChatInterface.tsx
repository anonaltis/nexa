import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatMessage, PollOption } from "@/types/project";

interface ChatInterfaceProps {
  onPlanComplete?: (plan: any) => void;
}

// Mock responses for demonstration - ready for AI backend integration
const mockResponses = [
  {
    content: "Great! Let me help you plan your electronics project. First, I need to understand what you're building.",
    poll: {
      question: "What type of project are you working on?",
      options: [
        { id: "1", label: "IoT / Smart Home", description: "Connected devices, sensors, automation" },
        { id: "2", label: "Robotics", description: "Motors, actuators, motion control" },
        { id: "3", label: "Audio / Video", description: "Amplifiers, displays, media" },
        { id: "4", label: "Power Electronics", description: "Power supplies, converters, chargers" },
      ],
    },
  },
  {
    content: "Excellent choice! Now let me understand the scope better.",
    poll: {
      question: "What's your experience level?",
      options: [
        { id: "1", label: "Beginner", description: "First few projects, learning basics" },
        { id: "2", label: "Intermediate", description: "Comfortable with soldering, basic circuits" },
        { id: "3", label: "Advanced", description: "Design my own PCBs, work with SMD" },
      ],
    },
  },
  {
    content: "Perfect! Based on your requirements, here's your project plan:\n\n## Project: Smart Temperature Monitor\n\n### Components Needed:\n- ESP32 DevKit v1\n- DHT22 Temperature/Humidity Sensor\n- 0.96\" OLED Display (I2C)\n- 10kΩ Resistor\n- Breadboard & Jumper Wires\n\n### Estimated Cost: $15-25\n\n### Connections:\n1. DHT22 VCC → ESP32 3.3V\n2. DHT22 GND → ESP32 GND\n3. DHT22 DATA → ESP32 GPIO4\n4. OLED SDA → ESP32 GPIO21\n5. OLED SCL → ESP32 GPIO22\n\nWould you like me to generate the PCB diagram and code?",
    poll: null,
  },
];

const ChatInterface = ({ onPlanComplete }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Welcome to ElectroLab! I'm your AI project assistant.\n\nDescribe your electronics project idea, and I'll help you:\n- Plan the components and connections\n- Generate PCB diagrams\n- Write code for ESP32/Arduino\n- Troubleshoot issues\n\nWhat would you like to build?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [responseIndex, setResponseIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response - ready for backend integration
    // TODO: Replace with actual API call to AI service
    setTimeout(() => {
      const response = mockResponses[responseIndex % mockResponses.length];
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.content,
        timestamp: new Date(),
        metadata: response.poll
          ? {
              type: "poll",
              pollOptions: response.poll.options.map((o) => ({ ...o, selected: false })),
            }
          : undefined,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setResponseIndex((prev) => prev + 1);
      setIsLoading(false);
    }, 1500);
  };

  const handlePollSelect = (messageId: string, optionId: string) => {
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
      setTimeout(() => {
        const userMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "user",
          content: selectedOption.label,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);
        handleSend();
      }, 300);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}

            <div className={`max-w-[80%] ${message.role === "user" ? "order-first" : ""}`}>
              <div
                className={`p-4 rounded-2xl ${
                  message.role === "user"
                    ? "chat-bubble-user"
                    : "chat-bubble-ai"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
              </div>

              {/* Poll Options */}
              {message.metadata?.type === "poll" && message.metadata.pollOptions && (
                <div className="mt-3 space-y-2">
                  {message.metadata.pollOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handlePollSelect(message.id, option.id)}
                      disabled={!!message.metadata?.selectedOption}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        option.selected
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-border bg-card hover:border-primary/50 hover:bg-card/80"
                      } ${message.metadata?.selectedOption ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{option.label}</div>
                          {option.description && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {option.description}
                            </div>
                          )}
                        </div>
                        {option.selected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="text-xs text-muted-foreground mt-1 px-1">
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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
