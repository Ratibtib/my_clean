import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Text as RNText, TouchableOpacity } from 'react-native';
import Svg, { Rect, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { COLORS, SPACING, RADIUS, STATUS_COLORS } from '../utils/colors';
import { QuickValidate } from './QuickValidate';
import { useTaskStore } from '../store/useTaskStore';
import { TaskStatus, Target } from '../types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PLAN_PADDING = 24;
const PLAN_WIDTH = SCREEN_WIDTH - PLAN_PADDING * 2;
const SVG_W = 400;
const SVG_H = SVG_W * 0.85;
const PLAN_HEIGHT = PLAN_WIDTH * (SVG_H / SVG_W);
const SCALE = PLAN_WIDTH / SVG_W;

function getTargetStatus(targetName: string, taskStatuses: any[]): TaskStatus {
  const tasks = taskStatuses.filter((t: any) => t.target_name === targetName);
  if (tasks.length === 0) return 'green';
  if (tasks.some((t: any) => t.status === 'red')) return 'red';
  if (tasks.some((t: any) => t.status === 'orange')) return 'orange';
  return 'green';
}

const EQUIP_EMOJIS: Record<string, string> = {
  'four': '🍳', 'frigo': '🧊', 'lave-linge': '🫧', 'machine': '🫧',
  'wc': '🚽', 'toilettes': '🚽', 'lave-vaisselle': '🍽', 'micro': '📡',
};

function getEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(EQUIP_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return '⚙️';
}

export function FloorPlan() {
  const [selectedTarget, setSelectedTarget] = useState<{ id: string; name: string } | null>(null);
  const { targets, taskStatuses } = useTaskStore();

  const zones = useMemo(() => targets.filter((t: Target) => t.type === 'zone'), [targets]);
  const equipment = useMemo(() => targets.filter((t: Target) => t.type === 'equipment'), [targets]);

  const statuses = useMemo(() => {
    const map: Record<string, TaskStatus> = {};
    targets.forEach((t: Target) => { map[t.id] = getTargetStatus(t.name, taskStatuses); });
    return map;
  }, [targets, taskStatuses]);

  // Single touch handler — find what was tapped by coordinates
  const handleCanvasTap = useCallback((evt: any) => {
    const { locationX, locationY } = evt.nativeEvent;
    const svgX = locationX / SCALE;
    const svgY = locationY / SCALE;

    // Check equipment first (they're on top, smaller = priority)
    for (const eq of equipment) {
      const dx = svgX - eq.position_x;
      const dy = svgY - eq.position_y;
      if (Math.sqrt(dx * dx + dy * dy) < 20) {
        setSelectedTarget({ id: eq.id, name: eq.name });
        return;
      }
    }

    // Then check zones
    for (const zone of zones) {
      const w = zone.width || 80;
      const h = zone.height || 60;
      if (svgX >= zone.position_x && svgX <= zone.position_x + w &&
          svgY >= zone.position_y && svgY <= zone.position_y + h) {
        setSelectedTarget({ id: zone.id, name: zone.name });
        return;
      }
    }
  }, [equipment, zones]);

  if (targets.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <RNText style={{ fontSize: 40, marginBottom: 12 }}>📍</RNText>
        <RNText style={{ fontSize: 15, color: COLORS.textSecondary, textAlign: 'center' }}>
          Aucune zone dessinée.{'\n'}Allez dans Admin → Modifier le plan.
        </RNText>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity activeOpacity={1} onPress={handleCanvasTap} style={styles.planContainer}>
        <Svg width={PLAN_WIDTH} height={PLAN_HEIGHT} viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
          <Rect x={0} y={0} width={SVG_W} height={SVG_H} rx={8} fill="#EDEAE4" />
          {Array.from({ length: Math.floor(SVG_W / 20) }).map((_, i) => (
            <Line key={`gv${i}`} x1={i * 20} y1={0} x2={i * 20} y2={SVG_H} stroke="#D6D3CD" strokeWidth={0.2} />
          ))}
          {Array.from({ length: Math.floor(SVG_H / 20) }).map((_, i) => (
            <Line key={`gh${i}`} x1={0} y1={i * 20} x2={SVG_W} y2={i * 20} stroke="#D6D3CD" strokeWidth={0.2} />
          ))}
          {zones.map((zone: Target) => {
            const status = statuses[zone.id] ?? 'green';
            const colors = STATUS_COLORS[status];
            const w = zone.width || 80;
            const h = zone.height || 60;
            return (
              <G key={zone.id}>
                <Rect x={zone.position_x} y={zone.position_y} width={w} height={h} rx={6} fill={colors.light} opacity={0.5} />
                <Rect x={zone.position_x} y={zone.position_y} width={w} height={h} rx={6} fill="none" stroke={colors.main} strokeWidth={1.5} opacity={0.6} />
                <SvgText x={zone.position_x + w / 2} y={zone.position_y + h / 2} textAnchor="middle" fontSize={w < 60 ? 8 : 11} fontWeight="700" fill={colors.dark}>
                  {zone.name}
                </SvgText>
                {status === 'red' && (
                  <Circle cx={zone.position_x + w - 8} cy={zone.position_y + 8} r={4} fill={COLORS.red} opacity={0.9} />
                )}
              </G>
            );
          })}
          {equipment.map((eq: Target) => {
            const status = statuses[eq.id] ?? 'green';
            const colors = STATUS_COLORS[status];
            const emoji = getEmoji(eq.name);
            return (
              <G key={eq.id}>
                <Circle cx={eq.position_x} cy={eq.position_y} r={15} fill={colors.light} stroke={colors.main} strokeWidth={1.5} />
                <SvgText x={eq.position_x} y={eq.position_y - 2} textAnchor="middle" fontSize={12}>{emoji}</SvgText>
                <SvgText x={eq.position_x} y={eq.position_y + 12} textAnchor="middle" fontSize={6} fontWeight="700" fill={colors.dark}>
                  {eq.name.length > 8 ? eq.name.slice(0, 8) + '..' : eq.name}
                </SvgText>
                {status === 'red' && (
                  <Circle cx={eq.position_x + 12} cy={eq.position_y - 12} r={3.5} fill={COLORS.red} opacity={0.9} />
                )}
              </G>
            );
          })}
        </Svg>
      </TouchableOpacity>
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: COLORS.green }]} /><RNText style={styles.legendText}>À jour</RNText></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: COLORS.orange }]} /><RNText style={styles.legendText}>Bientôt</RNText></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: COLORS.red }]} /><RNText style={styles.legendText}>En retard</RNText></View>
      </View>
      {selectedTarget && (
        <QuickValidate targetId={selectedTarget.id} targetName={selectedTarget.name} onClose={() => setSelectedTarget(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  planContainer: { marginHorizontal: PLAN_PADDING / 2, borderRadius: RADIUS.lg, overflow: 'hidden', backgroundColor: '#F8F7F4', borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', padding: 4 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: SPACING.sm, paddingVertical: SPACING.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
});
