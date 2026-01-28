import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProjectProvider } from "@/contexts/ProjectContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ChatPage from "./pages/ChatPage";
import PCBViewer from "./pages/PCBViewer";
import CodeEditor from "./pages/CodeEditor";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import Components from "./pages/Components";
import Analyzer from "./pages/Analyzer";
import SchematicEditor from "./pages/SchematicEditor";
import NotFound from "./pages/NotFound";
import AITestLab from "./pages/AITestLab";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ProjectProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/pcb" element={<PCBViewer />} />
              <Route path="/code" element={<CodeEditor />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/components" element={<Components />} />
              <Route path="/analyzer" element={<Analyzer />} />
              <Route path="/schematic" element={<SchematicEditor />} />
              <Route path="/test-lab" element={<AITestLab />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ProjectProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
