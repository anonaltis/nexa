import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Sidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const navLinks = [
        { name: "Dashboard", path: "/dashboard" },
        { name: "Planning", path: "/chat" },
        { name: "Schematic", path: "/schematic" },
        { name: "PCB Design", path: "/pcb" },
        { name: "Code Studio", path: "/code" },
        { name: "Circuit Lab", path: "/analyzer" },
        { name: "Component DB", path: "/components" },
        { name: "Troubleshoot", path: "/troubleshoot" },
        { name: "AI Test Lab", path: "/test-lab" },
    ];

    const isActive = (path: string) => location.pathname === path;

    if (!user) return null;

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col z-50 overflow-hidden">
            {/* Brand */}
            <div className="p-6 border-b border-border">
                <Link to="/" className="flex items-center">
                    <span className="text-xl font-bold tracking-tight text-gradient-primary">ElectroLab</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                <p className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Main Menu</p>
                {navLinks.map((link) => (
                    <Link
                        key={link.path}
                        to={link.path}
                        className={cn(
                            "flex items-center justify-between group px-3 py-2.5 rounded-xl transition-all duration-200 outline-none",
                            isActive(link.path)
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        )}
                    >
                        <span className="text-sm font-medium">{link.name}</span>
                    </Link>
                ))}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-border bg-background/50 backdrop-blur-sm">
                <Link
                    to="/profile"
                    className={cn(
                        "flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-accent group",
                        isActive("/profile") ? "bg-accent" : ""
                    )}
                >
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate uppercase">{user.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                    </div>
                </Link>

                <Button
                    variant="ghost"
                    onClick={logout}
                    className="w-full mt-4 justify-start px-3 py-6 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl transition-all hover:scale-[0.98] active:scale-95"
                >
                    <span className="font-semibold">Logout Account</span>
                </Button>
            </div>
        </aside>
    );
};

export default Sidebar;
