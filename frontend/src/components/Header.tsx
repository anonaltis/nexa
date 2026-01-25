import { Cpu } from "lucide-react";

const Header = () => {
  return (
    <header className="w-full py-8">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="flex flex-col items-center text-center space-y-3">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Cpu className="w-10 h-10 text-primary animate-pulse-glow" />
              <div className="absolute inset-0 w-10 h-10 bg-primary/20 blur-xl rounded-full" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              <span className="text-gradient-primary">CircuitSathi</span>
            </h1>
          </div>
          
          {/* Subtitle with glow underline */}
          <p className="text-muted-foreground text-lg">
            Your AI Lab Partner for Circuit Debugging
          </p>
          
          {/* Subtle divider */}
          <div className="subtle-divider mt-4 max-w-md" />
        </div>
      </div>
    </header>
  );
};

export default Header;
