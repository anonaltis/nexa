import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
<<<<<<< HEAD
import remarkGfm from "remark-gfm";
import { Send, Bot, User, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { ChatMessage, PollOption } from "@/types/project";
=======
import { chatWithAI } from "@/lib/api";
>>>>>>> eb187e8 (Update UI components with functionality &  Changing the Backend from python to Typr Script and its Ai Modle still in the Python)

interface ChatInterfaceProps {
  onPlanComplete?: (plan: any) => void;
  sessionId: string | null;
  onSessionCreated?: (sessionId: string) => void;
}

<<<<<<< HEAD
const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Welcome to ElectroLab! I'm your AI project assistant.\n\nDescribe your electronics project idea, and I'll help you:\n- Plan the components and connections\n- Generate PCB diagrams\n- Write code for ESP32/Arduino\n- Troubleshoot issues\n\nWhat would you like to build?",
  timestamp: new Date(),
=======
interface ProjectPlan {
  projectType: string;
  experienceLevel: string;
  microcontroller: string;
  features: string[];
  components: { name: string; quantity: number; purpose: string }[];
  connections: { from: string; to: string; description: string }[];
}

// Planning questions flow
const planningQuestions = [
  {
    id: "project-type",
    content: "What type of electronics project are you building?",
    options: [
      { id: "iot", label: "IoT / Smart Home", description: "Connected devices, sensors, home automation", icon: "🏠" },
      { id: "robotics", label: "Robotics", description: "Motors, actuators, motion control systems", icon: "🤖" },
      { id: "audio", label: "Audio / Visual", description: "Amplifiers, LED displays, media projects", icon: "🔊" },
      { id: "power", label: "Power Electronics", description: "Power supplies, battery chargers, converters", icon: "⚡" },
    ],
  },
  {
    id: "experience",
    content: "What's your experience level with electronics?",
    options: [
      { id: "beginner", label: "Beginner", description: "New to electronics, learning the basics", icon: "🌱" },
      { id: "intermediate", label: "Intermediate", description: "Comfortable with breadboards and basic circuits", icon: "🔧" },
      { id: "advanced", label: "Advanced", description: "Design PCBs, work with SMD components", icon: "⚙️" },
    ],
  },
  {
    id: "microcontroller",
    content: "Which microcontroller platform would you prefer?",
    options: [
      { id: "esp32", label: "ESP32", description: "WiFi & Bluetooth, great for IoT projects", icon: "📶" },
      { id: "arduino", label: "Arduino Uno/Nano", description: "Simple, beginner-friendly, large community", icon: "🔌" },
      { id: "stm32", label: "STM32", description: "Powerful ARM-based, professional grade", icon: "💪" },
      { id: "none", label: "No Microcontroller", description: "Analog or passive circuit only", icon: "🔋" },
    ],
  },
  {
    id: "features",
    content: "What features do you need? (Select all that apply)",
    multiSelect: true,
    options: [
      { id: "sensors", label: "Sensors", description: "Temperature, humidity, motion, light", icon: "📡" },
      { id: "display", label: "Display", description: "LCD, OLED, LED indicators", icon: "📺" },
      { id: "wireless", label: "Wireless", description: "WiFi, Bluetooth, RF communication", icon: "📻" },
      { id: "motors", label: "Motors/Actuators", description: "Servo, stepper, DC motors", icon: "⚙️" },
    ],
  },
];

const generateProjectPlan = (answers: Record<string, string | string[]>): string => {
  const projectType = answers["project-type"] as string;
  const experience = answers["experience"] as string;
  const mcu = answers["microcontroller"] as string;
  const features = answers["features"] as string[] || [];

  let planContent = `## 📋 Project Plan Generated\n\n`;
  planContent += `### Project Type\n`;
  planContent += `${projectType === "iot" ? "🏠 IoT / Smart Home" : projectType === "robotics" ? "🤖 Robotics" : projectType === "audio" ? "🔊 Audio/Visual" : "⚡ Power Electronics"}\n\n`;

  planContent += `### Recommended Components\n\n`;

  // Base components based on MCU choice
  if (mcu === "esp32") {
    planContent += `| Component | Quantity | Purpose |\n|-----------|----------|----------|\n`;
    planContent += `| ESP32 DevKit v1 | 1 | Main microcontroller with WiFi/BT |\n`;
    planContent += `| 10kΩ Resistor | 4 | Pull-up/pull-down resistors |\n`;
    planContent += `| 100µF Capacitor | 2 | Power supply filtering |\n`;
  } else if (mcu === "arduino") {
    planContent += `| Component | Quantity | Purpose |\n|-----------|----------|----------|\n`;
    planContent += `| Arduino Nano | 1 | Main microcontroller |\n`;
    planContent += `| 10kΩ Resistor | 4 | Pull-up/pull-down resistors |\n`;
    planContent += `| 100µF Capacitor | 2 | Power supply filtering |\n`;
  }

  // Add feature-based components
  if (features.includes("sensors")) {
    planContent += `| DHT22 Sensor | 1 | Temperature & humidity sensing |\n`;
    planContent += `| HC-SR501 PIR | 1 | Motion detection |\n`;
  }
  if (features.includes("display")) {
    planContent += `| 0.96" OLED I2C | 1 | Display output |\n`;
    planContent += `| 5mm LED | 3 | Status indicators |\n`;
    planContent += `| 220Ω Resistor | 3 | LED current limiting |\n`;
  }
  if (features.includes("wireless")) {
    planContent += `| nRF24L01 Module | 1 | RF communication |\n`;
  }
  if (features.includes("motors")) {
    planContent += `| L298N Driver | 1 | Motor driver module |\n`;
    planContent += `| DC Motor | 2 | Actuation |\n`;
  }

  planContent += `\n### Estimated Cost\n`;
  planContent += experience === "beginner" ? `$15-25 (basic kit)` : experience === "intermediate" ? `$25-45 (with extras)` : `$40-80 (quality components)`;

  planContent += `\n\n### Connection Diagram Overview\n`;
  planContent += `The PCB will connect all components with proper routing. Key connections:\n`;
  if (mcu !== "none") {
    if (features.includes("sensors")) {
      planContent += `- **DHT22 DATA** → GPIO4\n`;
    }
    if (features.includes("display")) {
      planContent += `- **OLED SDA** → GPIO21 (I2C Data)\n`;
      planContent += `- **OLED SCL** → GPIO22 (I2C Clock)\n`;
    }
    planContent += `- **Power rails**: 3.3V and GND distributed across board\n`;
  }

  planContent += `\n---\n\n**Ready to generate your PCB diagram and code?**`;

  return planContent;
>>>>>>> eb187e8 (Update UI components with functionality &  Changing the Backend from python to Typr Script and its Ai Modle still in the Python)
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
<<<<<<< HEAD
=======
  }, [currentQuestionIndex]);

  const confirmMultiSelect = useCallback(() => {
    const currentQuestion = planningQuestions[currentQuestionIndex];
    const lastMessage = messages[messages.length - 1];
    const selectedOptions = lastMessage.metadata?.pollOptions?.filter(opt => opt.selected).map(opt => opt.id) || [];

    if (selectedOptions.length > 0) {
      processAnswer(selectedOptions, currentQuestion);
    }
  }, [currentQuestionIndex, messages]);

  const processAnswer = (answer: string | string[], question: typeof planningQuestions[0]) => {
    // Save answer
    const newAnswers = { ...answers, [question.id]: answer };
    setAnswers(newAnswers);

    // Add user response message
    const selectedLabels = Array.isArray(answer)
      ? question.options.filter(o => answer.includes(o.id)).map(o => o.label).join(", ")
      : question.options.find(o => o.id === answer)?.label || answer;

    const userMessage: ChatMessage = {
      id: `user-${question.id}`,
      role: "user",
      content: selectedLabels,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    setIsLoading(true);

    setTimeout(() => {
      const nextIndex = currentQuestionIndex + 1;

      if (nextIndex < planningQuestions.length) {
        // Ask next question
        const nextQuestion = planningQuestions[nextIndex];
        const questionMessage: ChatMessage = {
          id: `question-${nextQuestion.id}`,
          role: "assistant",
          content: nextQuestion.content,
          timestamp: new Date(),
          metadata: {
            type: "poll",
            pollOptions: nextQuestion.options.map(opt => ({ ...opt, selected: false })),
          },
        };
        setMessages(prev => [...prev, questionMessage]);
        setCurrentQuestionIndex(nextIndex);
      } else {
        // Generate project plan
        const planContent = generateProjectPlan(newAnswers);
        const planMessage: ChatMessage = {
          id: "plan-complete",
          role: "assistant",
          content: planContent,
          timestamp: new Date(),
          metadata: { type: "documentation" },
        };
        setMessages(prev => [...prev, planMessage]);
        setPlanningPhase("complete");

        if (onPlanComplete) {
          onPlanComplete({
            projectType: newAnswers["project-type"] as string,
            experienceLevel: newAnswers["experience"] as string,
            microcontroller: newAnswers["microcontroller"] as string,
            features: newAnswers["features"] as string[] || [],
            components: [],
            connections: [],
          });
        }
      }
      setIsLoading(false);
    }, 800);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatWithAI(userMessage.content);

      const aiMessage: ChatMessage = {
        id: response.id || crypto.randomUUID(),
        role: "assistant",
        content: response.content,
        timestamp: response.timestamp ? new Date(response.timestamp) : new Date(),
        metadata: response.metadata,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "⚠️ Sorry, I'm having trouble connecting to the AI server. Please try again later.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
>>>>>>> eb187e8 (Update UI components with functionality &  Changing the Backend from python to Typr Script and its Ai Modle still in the Python)
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

<<<<<<< HEAD
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
=======
  const currentQuestion = planningQuestions[currentQuestionIndex];
  const isMultiSelectActive = currentQuestion?.multiSelect && planningPhase === "questions";
  const lastMessage = messages[messages.length - 1];
  const hasMultiSelections = isMultiSelectActive &&
    lastMessage?.metadata?.pollOptions?.some(opt => opt.selected);
>>>>>>> eb187e8 (Update UI components with functionality &  Changing the Backend from python to Typr Script and its Ai Modle still in the Python)

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

<<<<<<< HEAD
            <div
              className={`max-w-[80%] ${message.role === "user" ? "order-first" : ""
                }`}
            >
              <div
                className={`p-4 rounded-2xl ${message.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"
=======
            <div className={`max-w-[85%] ${message.role === "user" ? "order-first" : ""}`}>
              <div
                className={`p-4 rounded-2xl ${message.role === "user"
                  ? "chat-bubble-user"
                  : "chat-bubble-ai"
>>>>>>> eb187e8 (Update UI components with functionality &  Changing the Backend from python to Typr Script and its Ai Modle still in the Python)
                  }`}
              >
                <div className="text-sm prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:p-2 prose-pre:rounded-lg prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground text-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Poll Options */}
<<<<<<< HEAD
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
=======
              {message.metadata?.type === "poll" && message.metadata.pollOptions && (
                <>
                  <PollQuestion
                    options={message.metadata.pollOptions as PollOptionType[]}
                    selectedOption={message.metadata.selectedOption}
                    onSelect={(optionId) => handlePollSelect(message.id, optionId)}
                    disabled={message.id !== `question-${currentQuestion?.id}`}
                    multiSelect={currentQuestion?.multiSelect}
                  />
                  {currentQuestion?.multiSelect && message.id === `question-${currentQuestion.id}` && hasMultiSelections && (
                    <Button
                      onClick={confirmMultiSelect}
                      className="mt-3 w-full bg-primary hover:bg-primary/90"
                      size="sm"
                    >
                      Continue with selected options
                    </Button>
                  )}
                </>
              )}
>>>>>>> eb187e8 (Update UI components with functionality &  Changing the Backend from python to Typr Script and its Ai Modle still in the Python)

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

<<<<<<< HEAD
=======
      {/* Action Buttons when planning is complete */}
      {planningPhase === "complete" && (
        <div className="px-4 pb-2">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={onGeneratePCB}
              variant="outline"
              size="sm"
              className="gap-2 border-primary/30 hover:bg-primary/10"
            >
              <Cpu className="w-4 h-4" />
              View PCB Diagram
            </Button>
            <Button
              onClick={onGenerateCode}
              variant="outline"
              size="sm"
              className="gap-2 border-primary/30 hover:bg-primary/10"
            >
              <Code className="w-4 h-4" />
              Generate Code
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="w-4 h-4" />
              Export Plan
            </Button>
          </div>
        </div>
      )}

>>>>>>> eb187e8 (Update UI components with functionality &  Changing the Backend from python to Typr Script and its Ai Modle still in the Python)
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
