import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Alert, Share, Platform,
} from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../utils/colors';
import { useTaskStore } from '../store/useTaskStore';
import { useHouseholdStore } from '../store/useHouseholdStore';
import { useAuthStore } from '../store/useAuthStore';
import { createTarget, deleteTarget, createTaskDefinition } from '../services/tasks';
import { Target, TargetType } from '../types';

type AdminSection = 'household' | 'targets' | 'tasks';

export function AdminScreen({ navigation }: any) {
  const [section, setSection] = useState<AdminSection>('household');
  const { targets, taskTypes, fetchAll } = useTaskStore();
  const { currentHousehold, createHousehold, joinHousehold, fetchHouseholds } = useHouseholdStore();
  const { profile, signOut } = useAuthStore();

  // --- Create household ---
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const handleCreateHousehold = useCallback(async () => {
    if (!profile || !newHouseholdName.trim()) {
      Alert.alert('Erreur', 'Entrez un nom de foyer.');
      return;
    }
    try {
      await createHousehold(newHouseholdName.trim(), profile.id);
      setNewHouseholdName('');
      Alert.alert('✓ Foyer créé !', 'Vous pouvez maintenant ajouter des cibles et des tâches.');
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  }, [newHouseholdName, profile]);

  // --- Join household ---
  const [joinId, setJoinId] = useState('');
  const handleJoinHousehold = useCallback(async () => {
    if (!profile || !joinId.trim()) {
      Alert.alert('Erreur', 'Collez l\'ID du foyer.');
      return;
    }
    try {
      await joinHousehold(joinId.trim(), profile.id);
      setJoinId('');
      Alert.alert('✓ Vous avez rejoint le foyer !');
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  }, [joinId, profile]);

  // --- Share / Invite ---
  const handleInvite = useCallback(async () => {
    if (!currentHousehold) return;
    try {
      await Share.share({
        message: `Rejoins mon foyer "${currentHousehold.name}" sur Chorify !\n\nID du foyer :\n${currentHousehold.id}`,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  }, [currentHousehold]);

  // --- Logout ---
  const handleLogout = useCallback(() => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: () => signOut() },
    ]);
  }, [signOut]);

  // --- Add target ---
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
        position_x: 100 + Math.random() * 200,
        position_y: 100 + Math.random() * 150,
        icon: null,
      });
      setNewTargetName('');
      await fetchAll(currentHousehold.id);
      Alert.alert('✓ Cible ajoutée');
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  }, [currentHousehold, newTargetName, newTargetType, fetchAll]);

  const handleDeleteTarget = useCallback((target: Target) => {
    if (!currentHousehold) return;
    Alert.alert('Supprimer', `Supprimer "${target.name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          await deleteTarget(target.id);
          await fetchAll(currentHousehold.id);
        },
      },
    ]);
  }, [currentHousehold, fetchAll]);

  // --- Add task ---
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [selectedTaskTypeId, setSelectedTaskTypeId] = useState<string | null>(null);
  const [maxDays, setMaxDays] = useState('7');

  const handleAddTask = useCallback(async () => {
    if (!currentHousehold || !selectedTargetId || !selectedTaskTypeId) {
      Alert.alert('Erreur', 'Sélectionnez une cible et un type.');
      return;
    }
    const days = parseInt(maxDays, 10);
    if (isNaN(days) || days < 1) {
      Alert.alert('Erreur', 'Délai invalide.');
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
      Alert.alert('✓ Tâche créée');
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  }, [currentHousehold, selectedTargetId, selectedTaskTypeId, maxDays, fetchAll]);

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.content}>
        {/* Header + Logout */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.title}>Administration</Text>
            <Text style={s.subtitle}>{profile?.display_name ?? ''}</Text>
          </View>
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
            <Text style={s.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={s.tabs}>
          {(['household', 'targets', 'tasks'] as AdminSection[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[s.tab, section === tab && s.tabActive]}
              onPress={() => setSection(tab)}
            >
              <Text style={[s.tabText, section === tab && s.tabTextActive]}>
                {tab === 'household' ? 'Foyer' : tab === 'targets' ? 'Cibles' : 'Tâches'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* === FOYER === */}
        {section === 'household' && (
          <View style={s.section}>
            {currentHousehold ? (
              <>
                <Text style={s.sectionTitle}>Mon foyer</Text>
                <View style={s.infoCard}>
                  <Text style={s.infoLabel}>Nom</Text>
                  <Text style={s.infoValue}>{currentHousehold.name}</Text>
                </View>

                <TouchableOpacity style={s.inviteBtn} onPress={handleInvite}>
                  <Text style={s.inviteBtnText}>📤 Inviter un membre</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[s.inviteBtn, { backgroundColor: "#F5F5F4" }]} onPress={() => navigation?.navigate?.("PlanEditor")}>
                  <Text style={[s.inviteBtnText, { color: "#1C1917" }]}>🏠 Modifier le plan</Text>
                </TouchableOpacity>

                <View style={s.infoCard}>
                  <Text style={s.infoLabel}>ID du foyer (pour invitation)</Text>
                  <Text style={[s.infoValue, { fontSize: 10 }]}>{currentHousehold.id}</Text>
                </View>

                <View style={s.divider} />

                <Text style={s.sectionTitle}>Rejoindre un autre foyer</Text>
                <TextInput
                  style={s.input}
                  placeholder="Coller l'ID du foyer"
                  placeholderTextColor={COLORS.textTertiary}
                  value={joinId}
                  onChangeText={setJoinId}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={s.addBtn} onPress={handleJoinHousehold}>
                  <Text style={s.addBtnText}>Rejoindre</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={s.sectionTitle}>Créer un foyer</Text>
                <TextInput
                  style={s.input}
                  placeholder="Nom du foyer"
                  placeholderTextColor={COLORS.textTertiary}
                  value={newHouseholdName}
                  onChangeText={setNewHouseholdName}
                />
                <TouchableOpacity style={s.addBtn} onPress={handleCreateHousehold}>
                  <Text style={s.addBtnText}>+ Créer le foyer</Text>
                </TouchableOpacity>

                <View style={s.divider} />

                <Text style={s.sectionTitle}>Rejoindre un foyer existant</Text>
                <TextInput
                  style={s.input}
                  placeholder="Coller l'ID du foyer"
                  placeholderTextColor={COLORS.textTertiary}
                  value={joinId}
                  onChangeText={setJoinId}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={s.addBtn} onPress={handleJoinHousehold}>
                  <Text style={s.addBtnText}>Rejoindre</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* === CIBLES === */}
        {section === 'targets' && (
          <View style={s.section}>
            {!currentHousehold ? (
              <Text style={s.noItems}>Créez d'abord un foyer dans l'onglet Foyer.</Text>
            ) : (
              <>
                <Text style={s.sectionTitle}>Ajouter une cible</Text>
                <TextInput
                  style={s.input}
                  placeholder="Nom (ex: Bureau, Terrasse…)"
                  placeholderTextColor={COLORS.textTertiary}
                  value={newTargetName}
                  onChangeText={setNewTargetName}
                />
                <View style={s.typeToggle}>
                  <TouchableOpacity
                    style={[s.typeBtn, newTargetType === 'zone' && s.typeBtnActive]}
                    onPress={() => setNewTargetType('zone')}
                  >
                    <Text style={[s.typeBtnText, newTargetType === 'zone' && s.typeBtnTextActive]}>Zone</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.typeBtn, newTargetType === 'equipment' && s.typeBtnActive]}
                    onPress={() => setNewTargetType('equipment')}
                  >
                    <Text style={[s.typeBtnText, newTargetType === 'equipment' && s.typeBtnTextActive]}>Équipement</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={s.addBtn} onPress={handleAddTarget}>
                  <Text style={s.addBtnText}>+ Ajouter</Text>
                </TouchableOpacity>

                <Text style={s.sectionTitle}>Cibles existantes ({targets.length})</Text>
                {targets.map((t) => (
                  <View key={t.id} style={s.listItem}>
                    <View>
                      <Text style={s.listItemTitle}>{t.name}</Text>
                      <Text style={s.listItemSub}>{t.type === 'zone' ? '📍 Zone' : '⚙️ Équipement'}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteTarget(t)}>
                      <Text style={s.deleteText}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {targets.length === 0 && <Text style={s.noItems}>Aucune cible</Text>}
              </>
            )}
          </View>
        )}

        {/* === TÂCHES === */}
        {section === 'tasks' && (
          <View style={s.section}>
            {!currentHousehold ? (
              <Text style={s.noItems}>Créez d'abord un foyer dans l'onglet Foyer.</Text>
            ) : (
              <>
                <Text style={s.sectionTitle}>Créer une tâche</Text>

                <Text style={s.fieldLabel}>Cible</Text>
                <View style={s.chipRow}>
                  {targets.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      style={[s.chip, selectedTargetId === t.id && s.chipActive]}
                      onPress={() => setSelectedTargetId(t.id)}
                    >
                      <Text style={[s.chipText, selectedTargetId === t.id && s.chipTextActive]}>
                        {t.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={s.fieldLabel}>Type de tâche</Text>
                <View style={s.chipRow}>
                  {taskTypes.map((tt) => (
                    <TouchableOpacity
                      key={tt.id}
                      style={[s.chip, selectedTaskTypeId === tt.id && s.chipActive]}
                      onPress={() => setSelectedTaskTypeId(tt.id)}
                    >
                      <Text style={[s.chipText, selectedTaskTypeId === tt.id && s.chipTextActive]}>
                        {tt.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={s.fieldLabel}>Délai max (jours)</Text>
                <TextInput
                  style={s.input}
                  placeholder="7"
                  placeholderTextColor={COLORS.textTertiary}
                  value={maxDays}
                  onChangeText={setMaxDays}
                  keyboardType="number-pad"
                />

                <TouchableOpacity style={s.addBtn} onPress={handleAddTask}>
                  <Text style={s.addBtnText}>+ Créer la tâche</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: SPACING.lg, paddingBottom: 120 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  logoutBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.red },
  logoutText: { fontSize: 12, fontWeight: '600', color: COLORS.red },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.md, padding: 3, marginBottom: SPACING.lg },
  tab: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: RADIUS.sm },
  tabActive: { backgroundColor: COLORS.surface, ...SHADOWS.sm },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textTertiary },
  tabTextActive: { color: COLORS.text },
  section: { gap: SPACING.sm },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginTop: SPACING.sm, marginBottom: SPACING.xs },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginTop: SPACING.sm },
  input: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2, fontSize: 14, color: COLORS.text },
  typeToggle: { flexDirection: 'row', gap: SPACING.sm },
  typeBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border },
  typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  typeBtnTextActive: { color: COLORS.surface },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  chip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, fontWeight: '500', color: COLORS.text },
  chipTextActive: { color: COLORS.surface },
  addBtn: { backgroundColor: COLORS.primary, paddingVertical: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', ...SHADOWS.md, marginTop: SPACING.xs },
  addBtnText: { color: COLORS.surface, fontSize: 14, fontWeight: '700' },
  inviteBtn: { backgroundColor: COLORS.streakLight, paddingVertical: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', marginVertical: SPACING.xs },
  inviteBtnText: { color: COLORS.streak, fontSize: 14, fontWeight: '700' },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, padding: SPACING.md, borderRadius: RADIUS.md, ...SHADOWS.sm },
  listItemTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  listItemSub: { fontSize: 11, color: COLORS.textTertiary, marginTop: 1 },
  deleteText: { fontSize: 12, fontWeight: '600', color: COLORS.red },
  noItems: { fontSize: 13, color: COLORS.textTertiary, textAlign: 'center', padding: SPACING.lg },
  infoCard: { backgroundColor: COLORS.surface, padding: SPACING.md, borderRadius: RADIUS.md, ...SHADOWS.sm },
  infoLabel: { fontSize: 11, color: COLORS.textTertiary, fontWeight: '500' },
  infoValue: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
});
