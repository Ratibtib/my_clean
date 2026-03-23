// ============================================================
// CHORIFY — Service Réalisations
// ============================================================

import { supabase } from './supabase';
import { TaskCompletion } from '../types';

/**
 * Valider une tâche (optimistic UI — appeler le store d'abord).
 */
export async function completeTask(
  taskDefinitionId: string,
  userId: string
): Promise<TaskCompletion> {
  const { data, error } = await supabase
    .from('task_completions')
    .insert({
      task_definition_id: taskDefinitionId,
      user_id: userId,
    })
    .select('*, profile:profiles(*), task_definition:task_definitions(*, task_type:task_types(*), target:targets(*))')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Supprimer une réalisation.
 */
export async function deleteCompletion(completionId: string): Promise<void> {
  const { error } = await supabase
    .from('task_completions')
    .delete()
    .eq('id', completionId);

  if (error) throw error;
}

/**
 * Historique des réalisations d'un foyer.
 */
export async function fetchCompletions(
  householdId: string,
  limit = 50,
  offset = 0
): Promise<TaskCompletion[]> {
  const { data, error } = await supabase
    .from('task_completions')
    .select(`
      *,
      profile:profiles(display_name, avatar_url),
      task_definition:task_definitions!inner(
        household_id,
        task_type:task_types(name, icon),
        target:targets(name, type)
      )
    `)
    .eq('task_definition.household_id', householdId)
    .order('completed_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data ?? [];
}

/**
 * Réalisations d'un utilisateur (pour stats personnelles).
 */
export async function fetchUserCompletions(
  userId: string,
  householdId: string,
  days = 30
): Promise<TaskCompletion[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('task_completions')
    .select(`
      *,
      task_definition:task_definitions!inner(
        household_id,
        task_type:task_types(name),
        target:targets(name)
      )
    `)
    .eq('user_id', userId)
    .eq('task_definition.household_id', householdId)
    .gte('completed_at', since.toISOString())
    .order('completed_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}
