import { Link, useLocation } from "react-router-dom";
import { CircuitBoard, Menu, X, User, LogOut, LayoutDashboard, MessageSquare, Cpu, Code, Activity, PenTool, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Removed navLinks as per user request
  const navLinks: any[] = [];

  const isActive = (path: string) => location.pathname === path;

  const publicPaths = ["/", "/about", "/contact", "/login", "/signup"];
  const isPublicPath = publicPaths.includes(location.pathname);
  const showSidebar = !!user && !isPublicPath;

  return (
    <nav className={`sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl transition-all duration-300 ${showSidebar ? "ml-64 w-[calc(100%-16rem)]" : ""}`}>
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center">
          {/* Left Side: Logo (if no sidebar) */}
          <div className="flex-1 flex items-center">
            {!showSidebar && (
              <Link to="/" className="flex items-center gap-2">
                <span className="text-xl font-bold text-gradient-primary uppercase tracking-tighter">EL</span>
              </Link>
            )}
          </div>

          {/* Center: Project Name */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <span className="text-lg md:text-xl font-black text-foreground uppercase tracking-[0.3em] font-mono">
              ElectroLab
            </span>
          </div>

          {/* Right Side: Auth Buttons / User Menu */}
          <div className="flex-1 flex justify-end items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 hover:bg-primary/5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card border-primary/20">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="text-[10px] font-bold uppercase tracking-widest">
                      User Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-primary/10" />
                  <DropdownMenuItem onClick={logout} className="text-destructive text-[10px] font-bold uppercase tracking-widest">
                    Terminate Session
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild className="h-8 px-4 text-[10px] font-bold uppercase tracking-widest">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild className="h-8 px-4 bg-primary hover:bg-primary/90 text-[10px] font-bold uppercase tracking-widest">
                  <Link to="/signup">Initialize</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
