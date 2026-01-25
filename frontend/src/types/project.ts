// ElectroLab Project Types
// These types define the data structures for the application
// Ready for backend integration with Supabase or other services

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  
  // Planning phase
  planningDoc?: PlanningDocument;
  
  // PCB phase
  pcbDiagram?: PCBDiagram;
  
  // Code phase (for ESP32/Arduino projects)
  codeFiles?: CodeFile[];
  
  // Metadata
  tags: string[];
  category: ProjectCategory;
}

export type ProjectStatus = 
  | 'planning'
  | 'designing'
  | 'coding'
  | 'building'
  | 'testing'
  | 'completed';

export type ProjectCategory = 
  | 'iot'
  | 'robotics'
  | 'audio'
  | 'power'
  | 'communication'
  | 'sensor'
  | 'display'
  | 'other';

export interface PlanningDocument {
  id: string;
  projectId: string;
  purpose: string;
  requirements: string[];
  components: ComponentSpec[];
  estimatedCost?: number;
  timeline?: string;
  notes: string;
  createdAt: Date;
}

export interface ComponentSpec {
  id: string;
  name: string;
  quantity: number;
  description: string;
  specifications?: string;
  estimatedPrice?: number;
  purchaseLink?: string;
}

export interface PCBDiagram {
  id: string;
  projectId: string;
  svgData: string;
  width: number;
  height: number;
  layers: PCBLayer[];
  components: PCBComponent[];
  connections: PCBConnection[];
  gerberFiles?: string; // Base64 encoded Gerber files for manufacturing
}

export interface PCBLayer {
  id: string;
  name: string;
  type: 'top' | 'bottom' | 'inner' | 'silkscreen' | 'solder-mask';
  visible: boolean;
}

export interface PCBComponent {
  id: string;
  name: string;
  package: string;
  x: number;
  y: number;
  rotation: number;
  value?: string;
  footprint: string;
}

export interface PCBConnection {
  id: string;
  from: { componentId: string; pin: string };
  to: { componentId: string; pin: string };
  netName: string;
}

export interface CodeFile {
  id: string;
  projectId: string;
  filename: string;
  content: string;
  language: 'cpp' | 'python' | 'arduino';
  lastModified: Date;
}

// Chat/AI Planning Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    type?: 'question' | 'poll' | 'documentation' | 'code' | 'diagram';
    pollOptions?: PollOption[];
    selectedOption?: string;
  };
}

export interface PollOption {
  id: string;
  label: string;
  description?: string;
  selected?: boolean;
}

export interface ChatSession {
  id: string;
  projectId?: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  defaultCategory?: ProjectCategory;
  favoriteComponents?: string[];
}

// API Response Types (for future backend integration)
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
