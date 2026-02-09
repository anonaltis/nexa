import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import GlobalAssistant from "../chat/GlobalAssistant";
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
  fullWidth?: boolean;
}

const Layout = ({ children, hideFooter = false, fullWidth = false }: LayoutProps) => {
  const { user } = useAuth();
  const location = useLocation();

  const publicPaths = ["/", "/about", "/contact", "/login", "/signup"];
  const isPublicPath = publicPaths.includes(location.pathname);
  const showSidebar = !!user && !isPublicPath;
  const showNavbar = true;

  return (
    <div className="min-h-screen bg-background flex flex-col blueprint-bg">
      {showNavbar && <Navbar />}

      <div className="flex flex-1 overflow-hidden">
        {showSidebar && <Sidebar />}
        <main className={`flex-1 relative z-10 overflow-auto ${showSidebar ? 'ml-64' : ''} ${fullWidth ? '' : 'container max-w-7xl mx-auto px-4 py-6'}`}>
          {children}
        </main>
      </div>

      <GlobalAssistant />

      {!hideFooter && !user && <Footer />}
    </div>
  );
};

export default Layout;
