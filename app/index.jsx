import { useEffect, useRef, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import CardChecklist from "../components/CardChecklist";
import CardImage from "../components/CardImage";
import CardNote from "../components/CardNote";
import { PALETTES, PAL_KEYS } from "../constants/palettes";
import ProjectBrowser from "../components/ProjectBrowser";
import {
  clearBoard,
  exportBoard,
  importBoard,
  loadBoard,
  loadProject,
  saveBoard,
  saveProject,
} from "../hooks/useStorage";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const DEFAULTS = [
  {
    id: uid(),
    type: "note",
    x: 80,
    y: 80,
    color: "violet",
    title: "🎮 Mi Videojuego",
    body: "Arrastra el fondo para moverte.\nPinch para zoom.\nDoble tap para editar.",
  },
  {
    id: uid(),
    type: "checklist",
    x: 370,
    y: 80,
    color: "sky",
    title: "Primeros pasos",
    items: [
      { id: uid(), text: "Definir género del juego", done: false },
      { id: uid(), text: "Elegir motor (Godot / Unity)", done: false },
      { id: uid(), text: "Crear GDD básico", done: false },
    ],
  },
];

/* ── Tarjeta individual con su propio gesture ── */

function CardWrap({
  card,
  isSel,
  isEdit,
  canvasScale,
  onSelect,
  onEdit,
  onDelete,
  onUpdate,
  onStopEdit,
  onResizeChange,
}) {
  const pal = PALETTES[card.color] || PALETTES.amber;
  const isImage = card.type === "image";
  const W = isImage ? (card.w || 280) : card.type === "checklist" ? 260 : 240;

  const posX = useSharedValue(card.x);
  const posY = useSharedValue(card.y);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  useEffect(() => { posX.value = card.x; }, [card.x]);
  useEffect(() => { posY.value = card.y; }, [card.y]);

  // ── Animación del color picker ──
  const colorMenuAnim = useSharedValue(0);
  useEffect(() => {
    colorMenuAnim.value = withTiming(isSel ? 1 : 0, { duration: 180 });
  }, [isSel]);
  const colorMenuStyle = useAnimatedStyle(() => ({
    opacity: colorMenuAnim.value,
    transform: [{ translateY: (1 - colorMenuAnim.value) * 8 }],
  }));

  // ── Resize (web / image cards — height only) ──
  const [resizing, setResizing] = useState(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!resizing || Platform.OS !== "web") return;
    onResizeChange?.(true);
    const onMove = (e) => {
      const dy = (e.clientY - resizing.sy) / canvasScale.value;
      onUpdate({ imgH: Math.max(60, resizing.sh + dy) });
    };
    const onUp = () => {
      setResizing(null);
      setHovered(false);
      onResizeChange?.(false);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup",   onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup",   onUp);
      onResizeChange?.(false);
    };
  }, [resizing]);

  // ── Click / double-click (web) ──
  const lastClickRef = useRef(0);
  const handleWebClick = Platform.OS === "web"
    ? (e) => {
        e.stopPropagation();
        if (isEdit) return;
        const now = Date.now();
        if (now - lastClickRef.current < 300) onEdit();
        else onSelect();
        lastClickRef.current = now;
      }
    : undefined;

  const composed = Platform.OS === "web"
    ? drag_gesture()
    : Gesture.Race(
        Gesture.Simultaneous(
          drag_gesture(),
          Gesture.Exclusive(
            Gesture.Tap().numberOfTaps(2).onEnd(() => runOnJS(onEdit)()),
            Gesture.Tap().onEnd(() => runOnJS(onSelect)()),
          ),
        ),
      );

  function drag_gesture() {
    return Gesture.Pan()
      .enabled(!isEdit)
      .onStart(() => {
        startX.value = posX.value;
        startY.value = posY.value;
        runOnJS(onSelect)();
      })
      .onUpdate((e) => {
        posX.value = startX.value + e.translationX / canvasScale.value;
        posY.value = startY.value + e.translationY / canvasScale.value;
      })
      .onEnd(() => {
        runOnJS(onUpdate)({ x: posX.value, y: posY.value });
      });
  }

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: posX.value }, { translateY: posY.value }],
  }));

  return (
    // Animated.View posiciona la card; GestureDetector queda DENTRO
    // para que los handles de resize sean hermanos (no hijos) del gestor.
    <Animated.View
      style={[styles.cardWrapper, { width: W, zIndex: isSel ? 50 : 1 }, animStyle]}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { if (!resizing) setHovered(false); }}
    >
      {/* Color picker — flota encima del card, no altera su tamaño */}
      <Animated.View
        pointerEvents={isSel ? "box-none" : "none"}
        style={[styles.colorMenu, colorMenuStyle]}
      >
        <View style={styles.colorMenuInner}>
          {PAL_KEYS.map((k) => (
            <TouchableOpacity
              key={k}
              style={[styles.colorDot, {
                backgroundColor: PALETTES[k].bg,
                borderColor: PALETTES[k].accent,
                borderWidth: card.color === k ? 2.5 : 1,
              }]}
              onPress={() => onUpdate({ color: k })}
            />
          ))}
        </View>
      </Animated.View>

      {isSel && (
        <TouchableOpacity style={styles.delBtn} onPress={onDelete}>
          <Text style={styles.delText}>✕</Text>
        </TouchableOpacity>
      )}

      <GestureDetector gesture={composed}>
        <View
          style={[styles.card, { backgroundColor: pal.bg, borderColor: isSel ? "#818cf8" : pal.border }]}
          onClick={handleWebClick}
        >
          {card.type === "note"      && <CardNote      card={card} isEdit={isEdit} onUpdate={onUpdate} onBlur={onStopEdit} />}
          {card.type === "checklist" && <CardChecklist card={card} isEdit={isEdit} onUpdate={onUpdate} onBlur={onStopEdit} />}
          {card.type === "image"     && <CardImage     card={card} isEdit={isEdit} isSel={isSel} onUpdate={onUpdate} onBlur={onStopEdit} />}
        </View>
      </GestureDetector>

      {/* Handle de resize — solo cards de imagen con url, web, al hacer hover */}
      {isImage && Platform.OS === "web" && card.url && (hovered || resizing) && (
        <View
          pointerEvents="box-none"
          style={{ position: "absolute", bottom: -18, left: 0, right: 0, alignItems: "center", zIndex: 30 }}
        >
          <View
            style={{
              cursor: "ns-resize",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              backgroundColor: pal.accent || "#818cf8",
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 5,
              opacity: resizing ? 1 : 0.82,
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              setResizing({ sy: e.clientY, sh: card.imgH || 210 });
            }}
          >
            <Text style={{ color: "#fff", fontSize: 10, letterSpacing: 1, userSelect: "none" }}>↕</Text>
            <View style={{ width: 32, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.5)" }} />
          </View>
        </View>
      )}
    </Animated.View>
  );
}

/* ── Pantalla principal ── */
export default function Board() {
  const [view, setView] = useState(Platform.OS === "web" ? "browser" : "board");
  const [dirHandle, setDirHandle] = useState(null);

  const [cards, setCards] = useState(null);
  const [sel, setSel] = useState(null);
  const [edit, setEdit] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Canvas transform
  const offsetX = useSharedValue(40);
  const offsetY = useSharedValue(40);
  const scale = useSharedValue(1);
  const startOX = useSharedValue(40);
  const startOY = useSharedValue(40);
  const startScale = useSharedValue(1);
  const canvasTopRef = useRef(0);
  const projectFileRef = useRef(null); // FileSystemFileHandle para guardar sin diálogo
  const handleSaveRef = useRef(null);  // siempre apunta a la versión fresca de handleSave
  const [zoomPct, setZoomPct] = useState(100);
  const [anyResizing, setAnyResizing] = useState(false);

  /* Cargar */
  useEffect(() => {
    loadBoard().then((d) => {
      setCards(d?.cards || DEFAULTS);
      if (d?.offset) {
        offsetX.value = d.offset.x;
        offsetY.value = d.offset.y;
      }
      if (d?.scale) scale.value = d.scale;
      setLoaded(true);
    });
  }, []);

  /* Guardar */
  useEffect(() => {
    if (!loaded || !cards) return;
    saveBoard({
      cards,
      offset: { x: offsetX.value, y: offsetY.value },
      scale: scale.value,
    });
  }, [cards, loaded]);

  /* Keyboard shortcuts — web only */
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setSel(null);
        setEdit(null);
      }
      if ((e.key === "Delete" || e.key === "Backspace") && sel && !edit) {
        setCards((p) => p.filter((c) => c.id !== sel));
        setSel(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveRef.current?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sel, edit]);

  /* Wheel zoom — web only */
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const onWheel = (e) => {
      e.preventDefault();
      const mx = e.clientX;
      const my = e.clientY - canvasTopRef.current;
      const factor = e.deltaY < 0 ? 1.08 : 0.93;
      const nz = Math.max(0.2, Math.min(3, scale.value * factor));
      const ratio = nz / scale.value;
      offsetX.value = mx - (mx - offsetX.value) * ratio;
      offsetY.value = my - (my - offsetY.value) * ratio;
      scale.value = nz;
      setZoomPct(Math.round(nz * 100));
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  /* Gestures del canvas */
  const panGesture = Gesture.Pan()
    .enabled(!anyResizing)
    .onStart(() => {
      startOX.value = offsetX.value;
      startOY.value = offsetY.value;
    })
    .onUpdate((e) => {
      offsetX.value = startOX.value + e.translationX;
      offsetY.value = startOY.value + e.translationY;
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = Math.max(0.2, Math.min(3, startScale.value * e.scale));
    });

  const canvasGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const canvasStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: offsetX.value },
      { translateY: offsetY.value },
      { scale: scale.value },
    ],
  }));

  const dotGridStyle = useAnimatedStyle(() => ({
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundImage: "radial-gradient(circle, #1e2040 1.2px, transparent 1.2px)",
    backgroundSize: `${28 * scale.value}px ${28 * scale.value}px`,
    backgroundPosition: `${offsetX.value}px ${offsetY.value}px`,
    pointerEvents: "none",
  }));

  function addCard(type) {
    const id = uid();
    setCards((p) => [
      ...p,
      {
        id,
        type,
        color: "amber",
        x: 80 / scale.value,
        y: 80 / scale.value,
        ...(type === "note" && { title: "", body: "" }),
        ...(type === "checklist" && {
          title: "Lista",
          items: [{ id: uid(), text: "", done: false }],
        }),
        ...(type === "image" && { url: "", caption: "" }),
      },
    ]);
    setSel(id);
    setEdit(id);
    setShowMenu(false);
  }

  function updCard(id, patch) {
    setCards((p) => p.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }
  function delCard(id) {
    setCards((p) => p.filter((c) => c.id !== id));
    setSel(null);
    setEdit(null);
  }
  async function handleExport() {
    await exportBoard({
      cards,
      offset: { x: offsetX.value, y: offsetY.value },
      scale: scale.value,
    });
  }

  async function handleImport() {
    const data = await importBoard();
    if (!data) return;
    setCards(data.cards);
    if (data.offset) {
      offsetX.value = data.offset.x;
      offsetY.value = data.offset.y;
    }
    if (data.scale) scale.value = data.scale;
    projectFileRef.current = null;
  }

  async function handleSave() {
    const boardData = {
      cards,
      offset: { x: offsetX.value, y: offsetY.value },
      scale: scale.value,
    };
    const handle = await saveProject(boardData, projectFileRef.current, dirHandle);
    if (handle) projectFileRef.current = handle;
  }
  handleSaveRef.current = handleSave;

  function resetBoard() {
    projectFileRef.current = null;
    setCards([]);
    setSel(null);
    setEdit(null);
    offsetX.value = 40;
    offsetY.value = 40;
    scale.value = 1;
    setZoomPct(100);
  }

  async function handleNewProject() {
    if (Platform.OS === "web") {
      await clearBoard();
      resetBoard();
      setView("browser");
    } else {
      Alert.alert(
        "Nuevo proyecto",
        "¿Crear un nuevo proyecto? Se perderán los cambios no guardados.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Crear nuevo", style: "destructive", onPress: async () => {
            await clearBoard();
            resetBoard();
          }},
        ]
      );
    }
  }

  async function handleOpenProject(fileHandle, name) {
    try {
      const data = await loadProject(fileHandle);
      setCards(data.cards || []);
      if (data.offset) { offsetX.value = data.offset.x; offsetY.value = data.offset.y; }
      if (data.scale) { scale.value = data.scale; setZoomPct(Math.round(data.scale * 100)); }
      projectFileRef.current = fileHandle;
      setSel(null);
      setEdit(null);
      setView("board");
    } catch { alert(`No se pudo abrir "${name}".`); }
  }

  if (view === "browser")
    return (
      <ProjectBrowser
        dirHandle={dirHandle}
        onSelectFolder={(h) => { setDirHandle(h); }}
        onOpen={handleOpenProject}
        onNew={handleNewProject}
      />
    );

  if (!cards)
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Cargando board...</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      {/* ── Toolbar ── */}
      <View style={styles.toolbar}>
        {Platform.OS === "web" && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setView("browser")}>
            <Text style={styles.backBtnText}>← Proyectos</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.logo}>GAMEDEV BOARD</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolbarActions}
        >
          {/* Zoom — solo web (mobile usa pinch) */}
          {Platform.OS === "web" && (
            <View style={styles.zoomRow}>
              <TouchableOpacity style={styles.zbtn} onPress={() => {
                const nz = Math.max(0.2, scale.value - 0.1);
                scale.value = nz; setZoomPct(Math.round(nz * 100));
              }}>
                <Text style={styles.zbtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.zoomLabel}>{zoomPct}%</Text>
              <TouchableOpacity style={styles.zbtn} onPress={() => {
                const nz = Math.min(3, scale.value + 0.1);
                scale.value = nz; setZoomPct(Math.round(nz * 100));
              }}>
                <Text style={styles.zbtnText}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.zbtn} onPress={() => {
                scale.value = 1; offsetX.value = 40; offsetY.value = 40; setZoomPct(100);
              }}>
                <Text style={styles.zbtnText}>↺</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.tbtn} onPress={handleNewProject}>
            <Text style={styles.tbtnText}>🗋 Nuevo</Text>
          </TouchableOpacity>

          {Platform.OS === "web" && (
            <TouchableOpacity style={styles.tbtnPrimary} onPress={handleSave}>
              <Text style={styles.tbtnPrimaryText}>💾 Guardar</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.tbtn} onPress={handleImport}>
            <Text style={styles.tbtnText}>⬇ Importar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tbtn} onPress={handleExport}>
            <Text style={styles.tbtnText}>⬆ Exportar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tbtn} onPress={() => setShowMenu((v) => !v)}>
            <Text style={styles.tbtnText}>＋ Agregar</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ── Menú agregar ── */}
      {showMenu && (
        <View style={styles.addMenu}>
          {[
            { type: "note", icon: "🗒", label: "Nota de texto" },
            { type: "checklist", icon: "✅", label: "Lista de tareas" },
            { type: "image", icon: "🖼", label: "Imagen" },
          ].map((item) => (
            <TouchableOpacity
              key={item.type}
              style={styles.menuItem}
              onPress={() => addCard(item.type)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── Canvas ── */}
      <GestureDetector gesture={canvasGesture}>
        <View
          style={styles.canvas}
          onLayout={(e) => { canvasTopRef.current = e.nativeEvent.layout.y; }}
          onTouchStart={() => {
            setSel(null);
            setEdit(null);
            setShowMenu(false);
          }}
          onClick={() => {
            setSel(null);
            setEdit(null);
            setShowMenu(false);
          }}
        >
          <Animated.View style={dotGridStyle} />
          <Animated.View style={[styles.world, canvasStyle]}>
            {cards.map((card) => (
              <CardWrap
                key={card.id}
                card={card}
                isSel={sel === card.id}
                isEdit={edit === card.id}
                canvasScale={scale}
                onSelect={() => setSel(card.id)}
                onEdit={() => setEdit(card.id)}
                onDelete={() => delCard(card.id)}
                onUpdate={(p) => updCard(card.id, p)}
                onStopEdit={() => setEdit(null)}
                onResizeChange={setAnyResizing}
              />
            ))}
          </Animated.View>
        </View>
      </GestureDetector>

      {/* ── Info bar ── */}
      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          {cards.length} tarjetas • pellizca para zoom • arrastra para mover
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#080810" },
  loading: {
    flex: 1,
    backgroundColor: "#080810",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: { color: "#334155", fontSize: 14 },

  toolbar: {
    backgroundColor: "#09091a",
    borderBottomWidth: 1,
    borderBottomColor: "#151528",
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    color: "#a78bfa",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.5,
    flex: 1,
    marginLeft: 12,
  },
  backBtn: {
    borderWidth: 1,
    borderColor: "#1e2030",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  backBtnText: { color: "#6366f1", fontSize: 12, fontWeight: "600" },
  tbtn: {
    borderWidth: 1,
    borderColor: "#1e2030",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  tbtnText: { color: "#94a3b8", fontSize: 12 },
  tbtnPrimary: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  tbtnPrimaryText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  addMenu: {
    position: "absolute",
    top: 56,
    right: 20,
    zIndex: 300,
    backgroundColor: "#0e0e1e",
    borderWidth: 1,
    borderColor: "#252545",
    borderRadius: 12,
    padding: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 8,
  },
  menuIcon: { fontSize: 16 },
  menuLabel: { color: "#94a3b8", fontSize: 13 },

  canvas: { flex: 1, overflow: "hidden" },
  world: { position: "absolute", top: 0, left: 0 },

  cardWrapper: { position: "absolute" },
  resizeHandle: {
    position: "absolute",
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
  },
  card: {
    borderRadius: 13,
    borderWidth: 2,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  colorMenu: {
    position: "absolute",
    top: -44,
    left: 0,
    right: 0,
    zIndex: 40,
    alignItems: "center",
  },
  colorMenuInner: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#0e0e1e",
    borderWidth: 1,
    borderColor: "#252545",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  colorDot: { width: 22, height: 22, borderRadius: 11 },
  delBtn: {
    position: "absolute",
    top: -10,
    right: -10,
    zIndex: 20,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  delText: { color: "white", fontSize: 11, fontWeight: "700" },

  toolbarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 4,
  },
  zoomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: 12,
  },
  zbtn: {
    backgroundColor: "#0f0f1f",
    borderWidth: 1,
    borderColor: "#1e2030",
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  zbtnText: { color: "#94a3b8", fontSize: 15 },
  zoomLabel: {
    color: "#334155",
    fontSize: 11,
    width: 40,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },

  infoBar: {
    backgroundColor: "#09091a",
    borderTopWidth: 1,
    borderTopColor: "#151528",
    paddingVertical: 5,
    alignItems: "center",
  },
  infoText: { color: "#1e2040", fontSize: 10, letterSpacing: 0.5 },
});
