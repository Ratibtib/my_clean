// ============================================================
// CHORIFY — Store Tâches (Zustand) — Optimistic UI
// ============================================================

import { create } from 'zustand';
import { TaskStatusView, TaskCompletion, Target, TaskType } from '../types';
import * as tasksService from '../services/tasks';
import * as completionsService from '../services/completions';

interface TaskState {
  // Données
  taskStatuses: TaskStatusView[];
  targets: Target[];
  taskTypes: TaskType[];
  completions: TaskCompletion[];
  loading: boolean;
  refreshing: boolean;

  // Actions
  fetchAll: (householdId: string) => Promise<void>;
  refresh: (householdId: string) => Promise<void>;
  fetchCompletions: (householdId: string) => Promise<void>;

  // Optimistic UI
  completeTask: (taskDefinitionId: string, userId: string, householdId: string) => Promise<void>;
  deleteCompletion: (completionId: string, householdId: string) => Promise<void>;

  // Getters dérivés
  getTargetStatus: (targetId: string) => 'green' | 'orange' | 'red';
  getTasksForTarget: (targetId: string) => TaskStatusView[];
}

export const useTaskStore = create<TaskState>((set, get) => ({
  taskStatuses: [],
  targets: [],
  taskTypes: [],
  completions: [],
  loading: false,
  refreshing: false,

  fetchAll: async (householdId) => {
    set({ loading: true });
    try {
      const [statuses, targets, taskTypes] = await Promise.all([
        tasksService.fetchTaskStatuses(householdId),
        tasksService.fetchTargets(householdId),
        tasksService.fetchTaskTypes(),
      ]);
      set({ taskStatuses: statuses, targets, taskTypes });
    } finally {
      set({ loading: false });
    }
  },

  refresh: async (householdId) => {
    set({ refreshing: true });
    try {
      const statuses = await tasksService.fetchTaskStatuses(householdId);
      set({ taskStatuses: statuses });
    } finally {
      set({ refreshing: false });
    }
  },

  fetchCompletions: async (householdId) => {
    const completions = await completionsService.fetchCompletions(householdId);
    set({ completions });
  },

  completeTask: async (taskDefinitionId, userId, householdId) => {
    // Optimistic : mettre à jour le statut localement
    const prevStatuses = get().taskStatuses;
    set({
      taskStatuses: prevStatuses.map((t) =>
        t.task_definition_id === taskDefinitionId
          ? { ...t, status: 'green' as const, progress_ratio: 0, last_completed_at: new Date().toISOString(), last_completed_by: userId }
          : t
      ),
    });

    try {
      await completionsService.completeTask(taskDefinitionId, userId);
      // Rafraîchir pour avoir les données exactes du serveur
      await get().refresh(householdId);
    } catch (error) {
      // Rollback
      set({ taskStatuses: prevStatuses });
      throw error;
    }
  },

  deleteCompletion: async (completionId, householdId) => {
    const prevCompletions = get().completions;
    set({
      completions: prevCompletions.filter((c) => c.id !== completionId),
    });

    try {
      await completionsService.deleteCompletion(completionId);
      await get().refresh(householdId);
    } catch (error) {
      set({ completions: prevCompletions });
      throw error;
    }
  },

  // Statut agrégé d'une cible (pire statut parmi ses tâches)
  getTargetStatus: (targetId) => {
    const tasks = get().taskStatuses.filter(
      (t) => t.task_definition_id && (t.target_name === targetId || t.task_definition_id === targetId)
    );

    // Filtrer les tâches associées à cette cible via la position
    const targetTasks = get().taskStatuses.filter(
      (t) => {
        const target = get().targets.find((tgt) => tgt.id === targetId);
        return target && t.target_name === target.name;
      }
    );

    if (targetTasks.some((t) => t.status === 'red')) return 'red';
    if (targetTasks.some((t) => t.status === 'orange')) return 'orange';
    return 'green';
  },

  getTasksForTarget: (targetId) => {
    return get().taskStatuses.filter((t) => {
      const target = get().targets.find((tgt) => tgt.id === targetId);
      return target && t.target_name === target.name;
    });
  },
}));
