// ============================================================
// CHORIFY — Écran Historique
// ============================================================

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS, STATUS_COLORS } from '../utils/colors';
import { useTaskStore } from '../store/useTaskStore';
import { useHouseholdStore } from '../store/useHouseholdStore';
import { TaskCompletion } from '../types';
import { formatFullDate, timeAgo } from '../utils/dates';

export function HistoryScreen() {
  const { completions, fetchCompletions, deleteCompletion } = useTaskStore();
  const currentHousehold = useHouseholdStore((s) => s.currentHousehold);
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (currentHousehold) {
      fetchCompletions(currentHousehold.id);
    }
  }, [currentHousehold]);

  const handleRefresh = useCallback(async () => {
    if (!currentHousehold) return;
    setRefreshing(true);
    await fetchCompletions(currentHousehold.id);
    setRefreshing(false);
  }, [currentHousehold]);

  const handleDelete = useCallback((completion: TaskCompletion) => {
    if (!currentHousehold) return;

    Alert.alert(
      'Supprimer cette entrée ?',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteCompletion(completion.id, currentHousehold.id),
        },
      ]
    );
  }, [currentHousehold, deleteCompletion]);

  const renderItem = ({ item }: { item: TaskCompletion }) => {
    const taskDef = item.task_definition as any;
    const taskTypeName = taskDef?.task_type?.name ?? 'Tâche';
    const targetName = taskDef?.target?.name ?? '—';
    const userName = (item.profile as any)?.display_name ?? 'Utilisateur';

    return (
      <TouchableOpacity
        style={styles.card}
        onLongPress={() => handleDelete(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardLeft}>
          <View style={styles.cardIcon}>
            <Text style={styles.cardIconText}>✓</Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{taskTypeName}</Text>
          <Text style={styles.cardTarget}>{targetName}</Text>
          <View style={styles.cardMeta}>
            <Text style={styles.cardUser}>{userName}</Text>
            <Text style={styles.cardDot}>·</Text>
            <Text style={styles.cardDate}>{timeAgo(item.completed_at)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historique</Text>
        <Text style={styles.subtitle}>Appui long pour supprimer</Text>
      </View>

      <FlatList
        data={completions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>Aucune réalisation</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  cardLeft: {
    marginRight: SPACING.md,
    justifyContent: 'center',
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: {
    fontSize: 16,
    color: COLORS.green,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  cardTarget: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: SPACING.xs,
  },
  cardUser: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  cardDot: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  cardDate: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
