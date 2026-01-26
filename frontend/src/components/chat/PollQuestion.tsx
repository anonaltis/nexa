import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PollOptionType {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  selected?: boolean;
}

interface PollQuestionProps {
  options: PollOptionType[];
  selectedOption?: string;
  onSelect: (optionId: string) => void;
  disabled?: boolean;
  multiSelect?: boolean;
}

const PollQuestion = ({
  options,
  selectedOption,
  onSelect,
  disabled = false,
  multiSelect = false,
}: PollQuestionProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
      {options.map((option) => {
        const isSelected = multiSelect ? option.selected : option.id === selectedOption;
        
        return (
          <button
            key={option.id}
            onClick={() => !disabled && onSelect(option.id)}
            disabled={disabled && !isSelected}
            className={cn(
              "w-full p-3 rounded-xl border text-left transition-all duration-200",
              "hover:scale-[1.02] active:scale-[0.98]",
              isSelected
                ? "border-primary bg-primary/15 text-foreground ring-1 ring-primary/30"
                : "border-border bg-card/50 hover:border-primary/40 hover:bg-card/80",
              disabled && !isSelected && "opacity-50 cursor-not-allowed hover:scale-100"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {option.icon && <span className="text-lg">{option.icon}</span>}
                  <span className={cn(
                    "font-medium text-sm",
                    isSelected && "text-primary"
                  )}>
                    {option.label}
                  </span>
                </div>
                {option.description && (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {option.description}
                  </p>
                )}
              </div>
              {isSelected && (
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default PollQuestion;
