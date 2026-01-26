import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Sparkles, FileText, Cpu, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import PollQuestion, { PollOptionType } from "./PollQuestion";
import type { ChatMessage } from "@/types/project";
import ReactMarkdown from "react-markdown";

interface ChatInterfaceProps {
  onPlanComplete?: (plan: ProjectPlan) => void;
  onGeneratePCB?: () => void;
  onGenerateCode?: () => void;
}

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
};

const ChatInterface = ({ onPlanComplete, onGeneratePCB, onGenerateCode }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "👋 Welcome to **ElectroLab**!\n\nI'm your AI project assistant. I'll help you:\n\n• **Plan** your electronics project\n• **Design** a PCB diagram\n• **Generate** microcontroller code\n• **Troubleshoot** any issues\n\nLet's start by understanding your project. Answer a few questions and I'll create a complete plan!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [planningPhase, setPlanningPhase] = useState<"questions" | "complete">("questions");
  const [showInitialQuestion, setShowInitialQuestion] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show first question after welcome
  useEffect(() => {
    if (!showInitialQuestion) {
      const timer = setTimeout(() => {
        const firstQuestion = planningQuestions[0];
        const questionMessage: ChatMessage = {
          id: `question-${firstQuestion.id}`,
          role: "assistant",
          content: firstQuestion.content,
          timestamp: new Date(),
          metadata: {
            type: "poll",
            pollOptions: firstQuestion.options.map(opt => ({ ...opt, selected: false })),
          },
        };
        setMessages(prev => [...prev, questionMessage]);
        setShowInitialQuestion(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showInitialQuestion]);

  const handlePollSelect = useCallback((messageId: string, optionId: string) => {
    const currentQuestion = planningQuestions[currentQuestionIndex];
    const isMultiSelect = currentQuestion?.multiSelect;

    setMessages(prev =>
      prev.map(msg => {
        if (msg.id === messageId && msg.metadata?.pollOptions) {
          const updatedOptions = msg.metadata.pollOptions.map(opt => ({
            ...opt,
            selected: isMultiSelect
              ? opt.id === optionId ? !opt.selected : opt.selected
              : opt.id === optionId,
          }));
          return {
            ...msg,
            metadata: {
              ...msg.metadata,
              selectedOption: optionId,
              pollOptions: updatedOptions,
            },
          };
        }
        return msg;
      })
    );

    if (!isMultiSelect) {
      // Single select - proceed immediately
      processAnswer(optionId, currentQuestion);
    }
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

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "I understand your question! Based on your project plan, I can help you with:\n\n1. **PCB Diagram** - View and download the circuit layout\n2. **Code Generation** - Get starter code for your microcontroller\n3. **Troubleshooting** - Debug any issues\n\nUse the buttons below or ask me anything specific!",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const currentQuestion = planningQuestions[currentQuestionIndex];
  const isMultiSelectActive = currentQuestion?.multiSelect && planningPhase === "questions";
  const lastMessage = messages[messages.length - 1];
  const hasMultiSelections = isMultiSelectActive && 
    lastMessage?.metadata?.pollOptions?.some(opt => opt.selected);

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}

            <div className={`max-w-[85%] ${message.role === "user" ? "order-first" : ""}`}>
              <div
                className={`p-4 rounded-2xl ${
                  message.role === "user"
                    ? "chat-bubble-user"
                    : "chat-bubble-ai"
                }`}
              >
                <div className="text-sm prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>

              {/* Poll Options */}
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

              <div className="text-xs text-muted-foreground mt-1.5 px-1">
                {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>

            {message.role === "user" && (
              <div className="w-8 h-8 rounded-xl bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
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

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={planningPhase === "complete" ? "Ask a follow-up question..." : "Or type your project idea..."}
              rows={1}
              className="w-full resize-none bg-input border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all pr-12"
            />
            <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-primary hover:bg-primary/90 px-4 rounded-xl"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
