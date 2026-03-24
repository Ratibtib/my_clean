// ============================================================
// CHORIFY — Types TypeScript
// ============================================================

export type TaskStatus = 'green' | 'orange' | 'red';
export type TargetType = 'zone' | 'equipment';
export type MemberRole = 'admin' | 'member';

// ---------- Entités de base ----------

export interface Household {
  id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  push_token: string | null;
}

export interface HouseholdMembership {
  id: string;
  user_id: string;
  household_id: string;
  role: MemberRole;
  joined_at: string;
  // Jointures
  profile?: Profile;
  household?: Household;
}

export interface Target {
  id: string;
  household_id: string;
  name: string;
  type: TargetType;
  parent_id: string | null;
  position_x: number;
  position_y: number;
  icon: string | null;
  created_at: string;
  // Relations
  children?: Target[];
}

export interface TaskType {
  id: string;
  name: string;
  icon: string | null;
}

export interface TaskDefinition {
  id: string;
  household_id: string;
  task_type_id: string;
  target_id: string;
  max_interval_days: number;
  created_at: string;
  // Jointures
  task_type?: TaskType;
  target?: Target;
}

export interface TaskCompletion {
  id: string;
  task_definition_id: string;
  user_id: string;
  completed_at: string;
  // Jointures
  profile?: Profile;
  task_definition?: TaskDefinition;
}

// ---------- Vue enrichie ----------

export interface TaskStatusView {
  task_definition_id: string;
  household_id: string;
  max_interval_days: number;
  definition_created_at: string;
  task_type_name: string;
  task_type_icon: string | null;
  target_name: string;
  target_type: TargetType;
  target_parent_id: string | null;
  position_x: number;
  position_y: number;
  last_completed_at: string | null;
  last_completed_by: string | null;
  progress_ratio: number;
  status: TaskStatus;
}

// ---------- Stats ----------

export interface UserContribution {
  display_name: string;
  count: number;
}

export interface HouseholdStats {
  total_tasks: number;
  green_count: number;
  orange_count: number;
  red_count: number;
  completions_last_30d: number;
  user_contributions: UserContribution[] | null;
}

// ---------- Navigation ----------

export type RootTabParamList = {
  FloorPlan: undefined;
  TaskList: undefined;
  History: undefined;
  Agenda: undefined;
  Stats: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Admin: undefined;
  QuickValidate: { taskDefinitionId: string };
};
