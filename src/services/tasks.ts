// ============================================================
// CHORIFY — Service Tâches
// ============================================================

import { supabase } from './supabase';
import { TaskStatusView, Target, TaskDefinition, TaskType, HouseholdStats } from '../types';

// ---------- Vues enrichies ----------

export async function fetchTaskStatuses(householdId: string): Promise<TaskStatusView[]> {
  const { data, error } = await supabase
    .from('task_status_view')
    .select('*')
    .eq('household_id', householdId)
    .order('status', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// ---------- Cibles ----------

export async function fetchTargets(householdId: string): Promise<Target[]> {
  const { data, error } = await supabase
    .from('targets')
    .select('*')
    .eq('household_id', householdId)
    .order('name');

  if (error) throw error;
  return data ?? [];
}

export async function createTarget(target: Omit<Target, 'id' | 'created_at'>): Promise<Target> {
  const { data, error } = await supabase
    .from('targets')
    .insert(target)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTarget(id: string, updates: Partial<Target>): Promise<Target> {
  const { data, error } = await supabase
    .from('targets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTarget(id: string): Promise<void> {
  const { error } = await supabase.from('targets').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Types de tâche ----------

export async function fetchTaskTypes(): Promise<TaskType[]> {
  const { data, error } = await supabase
    .from('task_types')
    .select('*')
    .order('name');

  if (error) throw error;
  return data ?? [];
}

// ---------- Définitions de tâche ----------

export async function createTaskDefinition(
  def: Omit<TaskDefinition, 'id' | 'created_at'>
): Promise<TaskDefinition> {
  const { data, error } = await supabase
    .from('task_definitions')
    .insert(def)
    .select('*, task_type:task_types(*), target:targets(*)')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTaskDefinition(id: string): Promise<void> {
  const { error } = await supabase.from('task_definitions').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Stats ----------

export async function fetchHouseholdStats(householdId: string): Promise<HouseholdStats> {
  const { data, error } = await supabase.rpc('get_household_stats', {
    p_household_id: householdId,
  });

  if (error) throw error;
  return data;
}

// ---------- Streak ----------

export async function fetchHouseholdStreak(householdId: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_household_streak', {
    p_household_id: householdId,
  });

  if (error) throw error;
  return data ?? 0;
}
