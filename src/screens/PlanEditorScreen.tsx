import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Alert, TextInput,
  TouchableOpacity, Dimensions, Modal, PanResponder,
} from 'react-native';
import Svg, { Rect, Circle, G, Text as SvgText, Line } from 'react-native-svg';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../utils/colors';
import { useHouseholdStore } from '../store/useHouseholdStore';
import { useTaskStore } from '../store/useTaskStore';
import { supabase } from '../services/supabase';
import { Target } from '../types';

const SCREEN_W = Dimensions.get('window').width;
const CANVAS_PAD = 16;
const CANVAS_W = SCREEN_W - CANVAS_PAD * 2;
const CANVAS_H = CANVAS_W * 0.85;
const SVG_W = 400;
const SVG_H = SVG_W * 0.85;
const SCALE = CANVAS_W / SVG_W;

type EditorMode = 'zone' | 'equipment' | 'delete' | 'move';

interface LocalTarget {
  id?: string;
  name: string;
  type: 'zone' | 'equipment';
  x: number;
  y: number;
  w: number;
  h: number;
  parent_id: any;
  isNew?: boolean;
  toDelete?: boolean;
}

export function PlanEditorScreen({ navigation }: any) {
  const currentHousehold = useHouseholdStore((s: any) => s.currentHousehold);
  const { targets: dbTargets, fetchAll } = useTaskStore();

  const [items, setItems] = useState<LocalTarget[]>([]);
  const [mode, setMode] = useState<EditorMode>('zone');
  const [selected, setSelected] = useState<number | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [pendingItem, setPendingItem] = useState<LocalTarget | null>(null);
  const [saving, setSaving] = useState(false);

  // Load existing targets
  useEffect(() => {
    if (dbTargets.length > 0) {
      setItems(dbTargets.map((t: Target) => ({
        id: t.id,
        name: t.name,
        type: t.type,
        x: t.position_x,
        y: t.position_y,
        w: t.width || (t.type === 'zone' ? 80 : 30),
        h: t.height || (t.type === 'zone' ? 60 : 30),
        parent_id: t.parent_id,
      })));
    }
  }, [dbTargets]);

  // Detect which zone contains a point
  const findZoneAt = useCallback((px: number, py: number): LocalTarget | null => {
    const zones = items.filter((i) => i.type === 'zone' && !i.toDelete);
    for (const z of zones) {
      if (px >= z.x && px <= z.x + z.w && py >= z.y && py <= z.y + z.h) {
        return z;
      }
    }
    return null;
  }, [items]);

  // Check overlap with other zones
  const checkOverlap = useCallback((item: LocalTarget, idx: number): boolean => {
    const zones = items.filter((i, j) => i.type === 'zone' && j !== idx && !i.toDelete);
    for (const z of zones) {
      if (item.x < z.x + z.w && item.x + item.w > z.x &&
          item.y < z.y + z.h && item.y + item.h > z.y) {
        return true;
      }
    }
    return false;
  }, [items]);

  // Handle tap on canvas
  const handleCanvasTap = useCallback((evt: any) => {
    const { locationX, locationY } = evt.nativeEvent;
    const svgX = locationX / SCALE;
    const svgY = locationY / SCALE;

    if (mode === 'zone') {
      const newItem: LocalTarget = {
        name: '',
        type: 'zone',
        x: Math.max(5, svgX - 40),
        y: Math.max(5, svgY - 30),
        w: 80,
        h: 60,
        parent_id: null,
        isNew: true,
      };
      // Check overlap
      if (checkOverlap(newItem, -1)) {
        Alert.alert('Chevauchement', 'Impossible de placer une zone ici.');
        return;
      }
      setPendingItem(newItem);
      setNewName('');
      setShowNameModal(true);
    } else if (mode === 'equipment') {
      const parentZone = findZoneAt(svgX, svgY);
      if (!parentZone) {
        Alert.alert('Hors zone', 'Tapez à l\'intérieur d\'une zone pour ajouter un équipement.');
        return;
      }
      const parentId = parentZone.id || `local_${items.indexOf(parentZone)}`;
      const newItem: LocalTarget = {
        name: '',
        type: 'equipment',
        x: svgX,
        y: svgY,
        w: 30,
        h: 30,
        parent_id: parentId,
        isNew: true,
      };
      setPendingItem({ ...newItem, parent_id: parentZone.name as any });
      setNewName('');
      setShowNameModal(true);
    } else if (mode === 'delete') {
      // Find what's at this position
      const idx = items.findIndex((item) => {
        if (item.toDelete) return false;
        if (item.type === 'equipment') {
          return Math.abs(item.x - svgX) < 20 && Math.abs(item.y - svgY) < 20;
        }
        return svgX >= item.x && svgX <= item.x + item.w &&
               svgY >= item.y && svgY <= item.y + item.h;
      });
      if (idx === -1) return;
      const item = items[idx];

      // Count children and tasks
      const children = items.filter((i) => {
        if (item.id) return i.parent_id === item.id;
        return false;
      });
      const childNames = children.map((c) => c.name).join(', ');

      const msg = item.type === 'zone'
        ? `${children.length > 0 ? `${children.length} équipement(s) (${childNames}) et les ` : 'Les '}tâches associées seront aussi supprimées.`
        : 'Les tâches associées seront supprimées.';

      Alert.alert(
        `Supprimer "${item.name}" ?`,
        msg,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer', style: 'destructive',
            onPress: () => {
              setItems((prev) => prev.map((it, i) => {
                if (i === idx) return { ...it, toDelete: true };
                // Mark children for deletion too
                if (item.type === 'zone' && item.id && it.parent_id === item.id) {
                  return { ...it, toDelete: true };
                }
                return it;
              }));
            },
          },
        ]
      );
    } else if (mode === 'move') {
      const idx = items.findIndex((item) => {
        if (item.toDelete) return false;
        if (item.type === 'equipment') {
          return Math.abs(item.x - svgX) < 20 && Math.abs(item.y - svgY) < 20;
        }
        return svgX >= item.x && svgX <= item.x + item.w &&
               svgY >= item.y && svgY <= item.y + item.h;
      });
      setSelected(idx >= 0 ? idx : null);
    }
  }, [mode, items, findZoneAt, checkOverlap]);

  // Confirm name modal
  const handleConfirmName = useCallback(() => {
    if (!newName.trim() || !pendingItem) return;
    const finalItem = { ...pendingItem, name: newName.trim() };

    if (finalItem.type === 'equipment') {
      // Find the actual parent zone
      const parentZone = findZoneAt(finalItem.x, finalItem.y);
      (finalItem as any).parent_id = parentZone?.id || null;
    }

    setItems((prev) => [...prev, finalItem]);
    setShowNameModal(false);
    setPendingItem(null);
    setNewName('');
  }, [newName, pendingItem, findZoneAt]);

  // Move selected item
  const handleMove = useCallback((dx: number, dy: number) => {
    if (selected === null) return;
    setItems((prev) => prev.map((item, i) => {
      if (i !== selected) return item;
      const newX = Math.max(0, Math.min(SVG_W - item.w, item.x + dx / SCALE));
      const newY = Math.max(0, Math.min(SVG_H - item.h, item.y + dy / SCALE));
      return { ...item, x: newX, y: newY };
    }));
  }, [selected]);

  // Resize selected zone
  const handleResize = useCallback((corner: string, dx: number, dy: number) => {
    if (selected === null) return;
    setItems((prev) => prev.map((item, i) => {
      if (i !== selected || item.type !== 'zone') return item;
      const sdx = dx / SCALE;
      const sdy = dy / SCALE;
      let { x, y, w, h } = item;

      if (corner === 'br') { w = Math.max(40, w + sdx); h = Math.max(30, h + sdy); }
      else if (corner === 'bl') { x = x + sdx; w = Math.max(40, w - sdx); h = Math.max(30, h + sdy); }
      else if (corner === 'tr') { y = y + sdy; w = Math.max(40, w + sdx); h = Math.max(30, h - sdy); }
      else if (corner === 'tl') { x = x + sdx; y = y + sdy; w = Math.max(40, w - sdx); h = Math.max(30, h - sdy); }

      return { ...item, x, y, w, h };
    }));
  }, [selected]);

  // Save everything to Supabase
  const handleSave = useCallback(async () => {
    if (!currentHousehold) return;
    setSaving(true);

    try {
      // 1. Delete items marked for deletion (that have an id)
      const toDelete = items.filter((i) => i.toDelete && i.id);
      for (const item of toDelete) {
        await supabase.from('targets').delete().eq('id', item.id);
      }

      // 2. Update existing items
      const toUpdate = items.filter((i) => !i.toDelete && !i.isNew && i.id);
      for (const item of toUpdate) {
        await supabase.from('targets').update({
          position_x: Math.round(item.x),
          position_y: Math.round(item.y),
          width: Math.round(item.w),
          height: Math.round(item.h),
          name: item.name,
        }).eq('id', item.id);
      }

      // 3. Insert new items
      const toInsert = items.filter((i) => !i.toDelete && i.isNew);
      for (const item of toInsert) {
        // Resolve parent_id for equipment
        let parentId = null;
        if (item.type === 'equipment') {
          const parentZone = findZoneAt(item.x, item.y);
          if (parentZone?.id) parentId = parentZone.id;
        }

        const { data } = await supabase.from('targets').insert({
          household_id: currentHousehold.id,
          name: item.name,
          type: item.type,
          position_x: Math.round(item.x),
          position_y: Math.round(item.y),
          width: Math.round(item.w),
          height: Math.round(item.h),
          parent_id: parentId,
        }).select().single();

        // If it's a zone, update parent_id of its new equipment children
        if (data && item.type === 'zone') {
          const children = toInsert.filter((c) => c.type === 'equipment' && c.parent_id === item.name);
          // Will be handled when those children are inserted
        }
      }

      // Refresh
      await fetchAll(currentHousehold.id);
      Alert.alert('✓ Plan sauvegardé', 'Le plan a été mis à jour.');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Impossible de sauvegarder.');
    } finally {
      setSaving(false);
    }
  }, [items, currentHousehold, findZoneAt, fetchAll, navigation]);

  const activeItems = items.filter((i) => !i.toDelete);
  const zones = activeItems.filter((i) => i.type === 'zone');
  const equips = activeItems.filter((i) => i.type === 'equipment');

  const parentNameForPending = pendingItem?.type === 'equipment'
    ? (pendingItem as any).parent_id || ''
    : '';

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.backBtn}>← Retour</Text>
        </TouchableOpacity>
        <Text style={s.title}>Éditeur de plan</Text>
        <TouchableOpacity
          style={[s.saveBtn, saving && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={s.saveBtnText}>{saving ? '...' : 'Sauver'}</Text>
        </TouchableOpacity>
      </View>

      {/* Toolbar */}
      <View style={s.toolbar}>
        {(['zone', 'equipment', 'move', 'delete'] as EditorMode[]).map((m) => (
          <TouchableOpacity
            key={m}
            style={[s.toolBtn, mode === m && s.toolBtnActive]}
            onPress={() => { setMode(m); setSelected(null); }}
          >
            <Text style={[s.toolBtnText, mode === m && s.toolBtnTextActive]}>
              {m === 'zone' ? '+ Zone' : m === 'equipment' ? '+ Équip.' : m === 'move' ? '✋ Déplacer' : '🗑 Supprimer'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Canvas */}
      <View style={s.canvasWrap}>
        <TouchableOpacity activeOpacity={1} onPress={handleCanvasTap}>
          <Svg width={CANVAS_W} height={CANVAS_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}>
            {/* Grid */}
            {Array.from({ length: Math.floor(SVG_W / 20) }).map((_, i) => (
              <Line key={`gv${i}`} x1={i * 20} y1={0} x2={i * 20} y2={SVG_H}
                stroke="#E7E5E4" strokeWidth={0.3} />
            ))}
            {Array.from({ length: Math.floor(SVG_H / 20) }).map((_, i) => (
              <Line key={`gh${i}`} x1={0} y1={i * 20} x2={SVG_W} y2={i * 20}
                stroke="#E7E5E4" strokeWidth={0.3} />
            ))}

            {/* Zones */}
            {zones.map((z, i) => {
              const idx = items.indexOf(z);
              const isSelected = selected === idx;
              return (
                <G key={`z${i}`}>
                  <Rect
                    x={z.x} y={z.y} width={z.w} height={z.h}
                    rx={4}
                    fill={isSelected ? 'rgba(55,138,221,0.1)' : '#F5F5F4'}
                    stroke={isSelected ? '#378ADD' : '#A8A29E'}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                  <SvgText
                    x={z.x + z.w / 2} y={z.y + z.h / 2}
                    textAnchor="middle" fontSize={10} fontWeight="600"
                    fill="#44444A"
                  >
                    {z.name}
                  </SvgText>

                  {/* Resize handles when selected */}
                  {isSelected && (
                    <>
                      <Rect x={z.x - 5} y={z.y - 5} width={10} height={10} rx={2} fill="#378ADD" />
                      <Rect x={z.x + z.w - 5} y={z.y - 5} width={10} height={10} rx={2} fill="#378ADD" />
                      <Rect x={z.x - 5} y={z.y + z.h - 5} width={10} height={10} rx={2} fill="#378ADD" />
                      <Rect x={z.x + z.w - 5} y={z.y + z.h - 5} width={10} height={10} rx={2} fill="#378ADD" />
                    </>
                  )}
                </G>
              );
            })}

            {/* Equipment */}
            {equips.map((eq, i) => {
              const idx = items.indexOf(eq);
              const isSelected = selected === idx;
              return (
                <G key={`e${i}`}>
                  <Circle
                    cx={eq.x} cy={eq.y} r={12}
                    fill={isSelected ? 'rgba(55,138,221,0.15)' : '#FFF'}
                    stroke={isSelected ? '#378ADD' : '#A8A29E'}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                  <SvgText
                    x={eq.x} y={eq.y + 3}
                    textAnchor="middle" fontSize={7} fontWeight="600"
                    fill="#44444A"
                  >
                    {eq.name.length > 6 ? eq.name.slice(0, 6) + '..' : eq.name}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Move/Resize controls when selected */}
      {selected !== null && items[selected] && !items[selected].toDelete && (
        <View style={s.controls}>
          <Text style={s.controlsTitle}>
            {items[selected].name} — {items[selected].type === 'zone' ? 'Zone' : 'Équipement'}
          </Text>
          <View style={s.dpad}>
            <TouchableOpacity style={s.dpadBtn} onPress={() => handleMove(0, -10)}>
              <Text style={s.dpadText}>▲</Text>
            </TouchableOpacity>
            <View style={s.dpadRow}>
              <TouchableOpacity style={s.dpadBtn} onPress={() => handleMove(-10, 0)}>
                <Text style={s.dpadText}>◀</Text>
              </TouchableOpacity>
              <View style={s.dpadCenter}><Text style={s.dpadCenterText}>Move</Text></View>
              <TouchableOpacity style={s.dpadBtn} onPress={() => handleMove(10, 0)}>
                <Text style={s.dpadText}>▶</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.dpadBtn} onPress={() => handleMove(0, 10)}>
              <Text style={s.dpadText}>▼</Text>
            </TouchableOpacity>
          </View>
          {items[selected].type === 'zone' && (
            <View style={s.resizeRow}>
              <TouchableOpacity style={s.resizeBtn} onPress={() => handleResize('br', -10, 0)}>
                <Text style={s.resizeBtnText}>W-</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.resizeBtn} onPress={() => handleResize('br', 10, 0)}>
                <Text style={s.resizeBtnText}>W+</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.resizeBtn} onPress={() => handleResize('br', 0, -10)}>
                <Text style={s.resizeBtnText}>H-</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.resizeBtn} onPress={() => handleResize('br', 0, 10)}>
                <Text style={s.resizeBtnText}>H+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Name Modal */}
      <Modal visible={showNameModal} transparent animationType="fade">
        <View style={s.modalBg}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>
              {pendingItem?.type === 'zone' ? 'Nom de la zone' : 'Nom de l\'équipement'}
            </Text>
            {parentNameForPending ? (
              <View style={s.parentTag}>
                <Text style={s.parentTagText}>📍 {parentNameForPending}</Text>
              </View>
            ) : null}
            <TextInput
              style={s.modalInput}
              placeholder={pendingItem?.type === 'zone' ? 'ex: Salon, Cuisine...' : 'ex: Four, Frigo...'}
              placeholderTextColor={COLORS.textTertiary}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <View style={s.modalBtns}>
              <TouchableOpacity
                style={s.modalCancel}
                onPress={() => { setShowNameModal(false); setPendingItem(null); }}
              >
                <Text style={s.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.modalConfirm} onPress={handleConfirmName}>
                <Text style={s.modalConfirmText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Info bar */}
      <View style={s.infoBar}>
        <Text style={s.infoText}>
          {zones.length} zone{zones.length > 1 ? 's' : ''} · {equips.length} équipement{equips.length > 1 ? 's' : ''}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  backBtn: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  title: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  saveBtn: { backgroundColor: COLORS.green, paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.md },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  toolbar: { flexDirection: 'row', paddingHorizontal: SPACING.md, gap: 6, marginBottom: SPACING.sm },
  toolBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  toolBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  toolBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  toolBtnTextActive: { color: '#fff' },
  canvasWrap: { marginHorizontal: CANVAS_PAD, backgroundColor: '#fff', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  controls: { padding: SPACING.md, alignItems: 'center', gap: 8 },
  controlsTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  dpad: { alignItems: 'center', gap: 2 },
  dpadRow: { flexDirection: 'row', gap: 2 },
  dpadBtn: { width: 40, height: 36, backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  dpadText: { fontSize: 14, color: COLORS.text },
  dpadCenter: { width: 40, height: 36, backgroundColor: COLORS.surface, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  dpadCenterText: { fontSize: 9, color: COLORS.textTertiary, fontWeight: '600' },
  resizeRow: { flexDirection: 'row', gap: 6 },
  resizeBtn: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border },
  resizeBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, width: 280, ...SHADOWS.lg },
  modalTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.sm },
  parentTag: { backgroundColor: '#E6F1FB', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.sm, alignSelf: 'flex-start', marginBottom: SPACING.sm },
  parentTagText: { fontSize: 12, fontWeight: '600', color: '#0C447C' },
  modalInput: { backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: COLORS.text, marginBottom: SPACING.md },
  modalBtns: { flexDirection: 'row', gap: SPACING.sm },
  modalCancel: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  modalConfirm: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center' },
  modalConfirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  infoBar: { paddingVertical: SPACING.sm, alignItems: 'center' },
  infoText: { fontSize: 12, color: COLORS.textTertiary, fontWeight: '500' },
});
