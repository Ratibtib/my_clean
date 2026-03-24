// ============================================================
// CHORIFY — Écran Administration
// ============================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../utils/colors';
import { useTaskStore } from '../store/useTaskStore';
import { useHouseholdStore } from '../store/useHouseholdStore';
import { useAuthStore } from '../store/useAuthStore';
import { createTarget, deleteTarget } from '../services/tasks';
import { createTaskDefinition, deleteTaskDefinition } from '../services/tasks';
import { Target, TaskType, TargetType } from '../types';

type AdminSection = 'targets' | 'tasks' | 'household';

export function AdminScreen() {
  const [section, setSection] = useState<AdminSection>('targets');
  const { targets, taskTypes, fetchAll } = useTaskStore();
  const currentHousehold = useHouseholdStore((s) => s.currentHousehold);
  const profile = useAuthStore((s) => s.profile);

  // --- Ajouter une cible ---
  const [newTargetName, setNewTargetName] = useState('');
  const [newTargetType, setNewTargetType] = useState<TargetType>('zone');

  const handleAddTarget = useCallback(async () => {
    if (!currentHousehold || !newTargetName.trim()) {
      Alert.alert('Erreur', 'Entrez un nom pour la cible.');
      return;
    }

    try {
      await createTarget({
        household_id: currentHousehold.id,
        name: newTargetName.trim(),
        type: newTargetType,
        parent_id: null,
        position_x: 100 + Math.random() * 400,
        position_y: 100 + Math.random() * 300,
        icon: null,
      });
      setNewTargetName('');
      await fetchAll(currentHousehold.id);
      Alert.alert('Succès', 'Cible ajoutée.');
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  }, [currentHousehold, newTargetName, newTargetType, fetchAll]);

  const handleDeleteTarget = useCallback((target: Target) => {
    if (!currentHousehold) return;
    Alert.alert(
      'Supprimer',
      `Supprimer "${target.name}" et toutes ses tâches ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteTarget(target.id);
            await fetchAll(currentHousehold.id);
          },
        },
      ]
    );
  }, [currentHousehold, fetchAll]);

  // --- Ajouter une tâche ---
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [selectedTaskTypeId, setSelectedTaskTypeId] = useState<string | null>(null);
  const [maxDays, setMaxDays] = useState('7');

  const handleAddTask = useCallback(async () => {
    if (!currentHousehold || !selectedTargetId || !selectedTaskTypeId) {
      Alert.alert('Erreur', 'Sélectionnez une cible et un type de tâche.');
      return;
    }
    const days = parseInt(maxDays, 10);
    if (isNaN(days) || days < 1) {
      Alert.alert('Erreur', 'Le délai doit être un nombre positif.');
      return;
    }

    try {
      await createTaskDefinition({
        household_id: currentHousehold.id,
        task_type_id: selectedTaskTypeId,
        target_id: selectedTargetId,
        max_interval_days: days,
      });
      setSelectedTargetId(null);
      setSelectedTaskTypeId(null);
      setMaxDays('7');
      await fetchAll(currentHousehold.id);
      Alert.alert('Succès', 'Tâche créée.');
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  }, [currentHousehold, selectedTargetId, selectedTaskTypeId, maxDays, fetchAll]);

  if (!currentHousehold) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Sélectionnez un foyer.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Administration</Text>
        <Text style={styles.subtitle}>{currentHousehold.name}</Text>

        {/* Onglets */}
        <View style={styles.tabs}>
          {(['targets', 'tasks', 'household'] as AdminSection[]).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.tab, section === s && styles.tabActive]}
              onPress={() => setSection(s)}
            >
              <Text style={[styles.tabText, section === s && styles.tabTextActive]}>
                {s === 'targets' ? 'Cibles' : s === 'tasks' ? 'Tâches' : 'Foyer'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* === Section Cibles === */}
        {section === 'targets' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ajouter une cible</Text>

            <TextInput
              style={styles.input}
              placeholder="Nom (ex: Cuisine, Four…)"
              placeholderTextColor={COLORS.textTertiary}
              value={newTargetName}
              onChangeText={setNewTargetName}
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Type :</Text>
              <TouchableOpacity
                style={[styles.typeBtn, newTargetType === 'zone' && styles.typeBtnActive]}
                onPress={() => setNewTargetType('zone')}
              >
                <Text style={[styles.typeBtnText, newTargetType === 'zone' && styles.typeBtnTextActive]}>
                  Zone
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, newTargetType === 'equipment' && styles.typeBtnActive]}
                onPress={() => setNewTargetType('equipment')}
              >
                <Text style={[styles.typeBtnText, newTargetType === 'equipment' && styles.typeBtnTextActive]}>
                  Équipement
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.addBtn} onPress={handleAddTarget}>
              <Text style={styles.addBtnText}>+ Ajouter</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Cibles existantes</Text>
            {targets.map((t) => (
              <View key={t.id} style={styles.listItem}>
                <View>
                  <Text style={styles.listItemTitle}>{t.name}</Text>
                  <Text style={styles.listItemSub}>{t.type}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteTarget(t)}>
                  <Text style={styles.deleteText}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            ))}
            {targets.length === 0 && (
              <Text style={styles.noItems}>Aucune cible</Text>
            )}
          </View>
        )}

        {/* === Section Tâches === */}
        {section === 'tasks' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Créer une tâche</Text>

            <Text style={styles.fieldLabel}>Cible</Text>
            <View style={styles.chipRow}>
              {targets.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.chip, selectedTargetId === t.id && styles.chipActive]}
                  onPress={() => setSelectedTargetId(t.id)}
                >
                  <Text style={[styles.chipText, selectedTargetId === t.id && styles.chipTextActive]}>
                    {t.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Type de tâche</Text>
            <View style={styles.chipRow}>
              {taskTypes.map((tt) => (
                <TouchableOpacity
                  key={tt.id}
                  style={[styles.chip, selectedTaskTypeId === tt.id && styles.chipActive]}
                  onPress={() => setSelectedTaskTypeId(tt.id)}
                >
                  <Text style={[styles.chipText, selectedTaskTypeId === tt.id && styles.chipTextActive]}>
                    {tt.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Délai max (jours)</Text>
            <TextInput
              style={styles.input}
              placeholder="7"
              placeholderTextColor={COLORS.textTertiary}
              value={maxDays}
              onChangeText={setMaxDays}
              keyboardType="number-pad"
            />

            <TouchableOpacity style={styles.addBtn} onPress={handleAddTask}>
              <Text style={styles.addBtnText}>+ Créer la tâche</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* === Section Foyer === */}
        {section === 'household' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Nom du foyer</Text>
              <Text style={styles.infoValue}>{currentHousehold.name}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>ID (pour inviter)</Text>
              <Text style={[styles.infoValue, { fontSize: 11 }]}>{currentHousehold.id}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Mon profil</Text>
              <Text style={styles.infoValue}>{profile?.display_name ?? '—'}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl * 2 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2, marginBottom: SPACING.md },

  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: 3,
    marginBottom: SPACING.lg,
  },
  tab: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: RADIUS.sm },
  tabActive: { backgroundColor: COLORS.surface, ...SHADOWS.sm },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textTertiary },
  tabTextActive: { color: COLORS.text },

  section: { gap: SPACING.md },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginTop: SPACING.sm },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginTop: SPACING.sm },

  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: 15,
    color: COLORS.text,
  },

  switchRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  switchLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  typeBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  typeBtnTextActive: { color: COLORS.surface },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: COLORS.text },
  chipTextActive: { color: COLORS.surface },

  addBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  addBtnText: { color: COLORS.surface, fontSize: 15, fontWeight: '700' },

  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    ...SHADOWS.sm,
  },
  listItemTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  listItemSub: { fontSize: 12, color: COLORS.textTertiary, marginTop: 1 },
  deleteText: { fontSize: 13, fontWeight: '600', color: COLORS.red },
  noItems: { fontSize: 14, color: COLORS.textTertiary, textAlign: 'center', padding: SPACING.lg },

  infoCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    ...SHADOWS.sm,
  },
  infoLabel: { fontSize: 12, color: COLORS.textTertiary, fontWeight: '500' },
  infoValue: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 2 },

  emptyText: { fontSize: 14, color: COLORS.textSecondary },
});
