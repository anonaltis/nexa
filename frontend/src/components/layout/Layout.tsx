import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
  fullWidth?: boolean;
}

const Layout = ({ children, hideFooter = false, fullWidth = false }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col blueprint-bg">
      <Navbar />
      
      <main className={`flex-1 relative z-10 ${fullWidth ? '' : 'container max-w-7xl mx-auto px-4'}`}>
        {children}
      </main>

      {!hideFooter && <Footer />}
    </div>
  );
};

export default Layout;
