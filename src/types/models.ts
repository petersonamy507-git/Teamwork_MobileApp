// Shapes returned by the existing Crewdesk FastAPI backend, taken from how the web app reads them.
// Fields the mobile app does not use are left out; optional ones may be absent on some endpoints.

export type ID = number;

export type UserRole = 'owner' | 'admin' | 'member' | 'client' | (string & {});

export interface UserRef {
  id: ID;
  name: string;
  color?: string | null;
  email?: string;
}

export interface User extends UserRef {
  email: string;
  role: UserRole;
  title?: string | null;
  phone?: string | null;
  is_active?: boolean;
  company?: { id: ID; name: string } | null;
}

export type TaskPriority = 'none' | 'low' | 'medium' | 'high';
export type TaskStatus = 'new' | 'open' | 'in_progress' | 'completed' | (string & {});

export interface Task {
  id: ID;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  project_id?: ID | null;
  project_name?: string | null;
  tasklist_id?: ID | null;
  tasklist_name?: string | null;
  start_date?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
  progress?: number;
  estimate_minutes?: number | null;
  logged_minutes?: number | null;
  tags: string[];
  assignees: UserRef[];
  created_by?: UserRef | null;
  subtask_count?: number;
  subtasks?: Task[];
  comments?: Comment[];
  files?: ProjectFile[];
  time_entries?: TimeEntry[];
  parent_id?: ID | null;
  subtask_done?: number;
  comment_count?: number;
  is_private?: boolean;
}

export interface Comment {
  id: ID;
  body: string;
  created_at: string;
  user: UserRef | null;
}

export type ProjectHealth = 'good' | 'at_risk' | 'needs_attention' | 'none';

export interface Project {
  id: ID;
  name: string;
  description?: string | null;
  status: string;
  color?: string | null;
  health?: ProjectHealth | null;
  progress?: number;
  start_date?: string | null;
  end_date?: string | null;
  task_count?: number;
  completed_count?: number;
  late_count?: number;
  logged_minutes?: number;
  client?: { id: ID; name: string } | null;
  owner?: UserRef | null;
  members?: UserRef[];
  category_id?: ID | null;
  is_starred?: boolean;
  created_at?: string;
}

export interface TaskList {
  id: ID;
  name: string;
  milestone_id?: ID | null;
  completed_count?: number;
  tasks: Task[];
}

export interface Milestone {
  id: ID;
  name: string;
  due_date?: string | null;
  completed?: boolean;
  late?: boolean;
  project_id?: ID;
  project_name?: string | null;
  task_count?: number;
  completed_count?: number;
  owner?: UserRef | null;
}

export interface Message {
  id: ID;
  title: string;
  body: string;
  created_at: string;
  user: UserRef | null;
  reply_count?: number;
  project_name?: string | null;
  replies?: Comment[];
}

export interface ProjectFile {
  id: ID;
  name: string;
  size?: number;
  description?: string | null;
  created_at: string;
  user?: UserRef | null;
  content_type?: string | null;
}

export interface BoardColumn {
  id: ID;
  name: string;
  color?: string | null;
  tasks: Task[];
}

export interface Notebook {
  id: ID;
  title: string;
  body?: string | null;
  category?: string | null;
  project_id?: ID | null;
  project_name?: string | null;
  created_by?: UserRef | null;
  updated_at?: string;
}

export interface Category {
  id: ID;
  name: string;
}

export interface SearchResults {
  tasks: Task[];
  projects: Project[];
  messages: (Message & { project_id?: ID })[];
  people: UserRef[];
}

export interface AiChat {
  id: ID;
  messages: { role: 'user' | 'assistant' | (string & {}); text: string }[];
}

export interface ActivityItem {
  id: ID;
  action: string;
  created_at: string;
  user: UserRef | null;
  project_id?: ID | null;
  project_name?: string | null;
}

export interface InboxItem {
  id: ID;
  kind: string;
  message: string;
  link?: string | null;
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
  actor?: UserRef | null;
}

export interface RecentItem {
  id?: ID;
  kind: string;
  ref_id: ID;
  title: string;
  subtitle?: string | null;
  link?: string | null;
  viewed_at?: string;
  updated_at?: string;
  created_at?: string;
}

export interface TimeEntry {
  id: ID;
  minutes: number;
  date: string;
  billable?: boolean;
  description?: string | null;
  task_id?: ID | null;
  task_title?: string | null;
  project_id?: ID | null;
  project_name?: string | null;
  user?: UserRef | null;
}
