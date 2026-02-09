import { BookOpen, Sparkles } from "lucide-react";

interface LearningNote {
  id: string;
  concept: string;
  explanation: string;
  formula?: string;
}

interface LearningNotesPanelProps {
  notes: LearningNote[];
  isVisible: boolean;
}

const LearningNotesPanel = ({ notes, isVisible }: LearningNotesPanelProps) => {
  if (!isVisible || notes.length === 0) return null;

  return (
    <section className="w-full animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
      <div className="floating-card p-6 md:p-8 border border-primary/5">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/5 border border-primary/10">
            <BookOpen className="w-5 h-5 text-primary/70" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Learning Notes</h2>
            <p className="text-sm text-muted-foreground">Key concepts explained</p>
          </div>
        </div>

        {/* Notes Grid */}
        <div className="grid gap-6 grid-cols-1">
          {notes.map((note, index) => (
            <div
              key={note.id}
              className="space-y-3 p-4 rounded-lg bg-background/30 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary/50" />
                <h3 className="font-medium text-foreground">{note.concept}</h3>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {note.explanation}
              </p>

              {note.formula && (
                <div className="mt-3 p-3 rounded-md bg-card font-mono text-sm text-primary border border-primary/20">
                  {note.formula}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Educational Footer */}
        <div className="mt-6 pt-6 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground italic">
            Understanding these concepts will help you design better circuits in the future.
          </p>
        </div>
      </div>
    </section>
  );
};

export default LearningNotesPanel;
