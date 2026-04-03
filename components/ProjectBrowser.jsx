import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { listProjects, pickFolder } from "../hooks/useStorage";

function formatDate(iso) {
  if (!iso) return "Sin fecha";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  });
}


export default function ProjectBrowser({ dirHandle, onSelectFolder, onOpen, onNew }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!dirHandle) return;
    setLoading(true);
    listProjects(dirHandle).then((p) => { setProjects(p); setLoading(false); });
  }, [dirHandle]);

  async function handlePickFolder() {
    const handle = await pickFolder();
    if (handle) onSelectFolder(handle);
  }

  return (
    <View style={s.container}>
      {/* ── Header ── */}
      <View style={s.header}>
        <Text style={s.logo}>GAMEDEV BOARD</Text>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.btn} onPress={handlePickFolder}>
            <Text style={s.btnText}>
              {dirHandle ? `📁 ${dirHandle.name}` : "📁 Seleccionar carpeta"}
            </Text>
          </TouchableOpacity>
          {dirHandle && (
            <TouchableOpacity style={s.btnPrimary} onPress={onNew}>
              <Text style={s.btnPrimaryText}>＋ Nuevo proyecto</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Contenido ── */}
      {!dirHandle ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📁</Text>
          <Text style={s.emptyTitle}>Elige una carpeta de proyectos</Text>
          <Text style={s.emptyDesc}>
            Selecciona la carpeta donde están guardados o donde quieres guardar tus proyectos
          </Text>
          <TouchableOpacity style={s.btnPrimary} onPress={handlePickFolder}>
            <Text style={s.btnPrimaryText}>Seleccionar carpeta</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={s.empty}>
          <Text style={s.emptyDesc}>Cargando proyectos...</Text>
        </View>
      ) : projects.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🎮</Text>
          <Text style={s.emptyTitle}>No hay proyectos aún</Text>
          <Text style={s.emptyDesc}>Crea tu primer proyecto de diseño de videojuego</Text>
          <TouchableOpacity style={s.btnPrimary} onPress={onNew}>
            <Text style={s.btnPrimaryText}>＋ Nuevo proyecto</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.grid}>
          {projects.map((p) => (
            <TouchableOpacity
              key={p.name}
              style={s.card}
              onPress={() => onOpen(p.handle, p.name)}
            >
              <View style={s.cardThumb}>
                <Text style={{ fontSize: 30 }}>🎮</Text>
              </View>
              <Text style={s.cardName} numberOfLines={2}>{p.name}</Text>
              <View style={s.cardTags}>
                {p.typeCounts?.note > 0 && (
                  <View style={s.tag}><Text style={s.tagText}>🗒 {p.typeCounts.note}</Text></View>
                )}
                {p.typeCounts?.checklist > 0 && (
                  <View style={s.tag}><Text style={s.tagText}>✅ {p.typeCounts.checklist}</Text></View>
                )}
                {p.typeCounts?.image > 0 && (
                  <View style={s.tag}><Text style={s.tagText}>🖼 {p.typeCounts.image}</Text></View>
                )}
              </View>
              <Text style={s.cardMeta}>{p.cardCount} tarjeta{p.cardCount !== 1 ? "s" : ""}</Text>
              <Text style={s.cardDate}>{formatDate(p.savedAt)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#080810" },

  header: {
    backgroundColor: "#09091a",
    borderBottomWidth: 1,
    borderBottomColor: "#151528",
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { color: "#a78bfa", fontSize: 17, fontWeight: "800", letterSpacing: -0.5 },
  headerRight: { flexDirection: "row", gap: 10, alignItems: "center" },

  btn: {
    borderWidth: 1, borderColor: "#1e2030",
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8,
  },
  btnText: { color: "#94a3b8", fontSize: 12 },
  btnPrimary: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8,
  },
  btnPrimaryText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 32 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { color: "#e2e8f0", fontSize: 22, fontWeight: "700" },
  emptyDesc: { color: "#475569", fontSize: 14, textAlign: "center", maxWidth: 360 },

  grid: { flexDirection: "row", flexWrap: "wrap", padding: 28, gap: 18 },

  card: {
    width: 190,
    backgroundColor: "#0e0e1e",
    borderWidth: 1,
    borderColor: "#252545",
    borderRadius: 16,
    padding: 18,
    gap: 7,
  },
  cardThumb: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: "#151530",
    alignItems: "center", justifyContent: "center",
    marginBottom: 6,
  },
  cardName: { color: "#e2e8f0", fontSize: 15, fontWeight: "700", lineHeight: 21 },
  cardTags: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  tag: {
    backgroundColor: "#1a1a35",
    borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  tagText: { color: "#6366f1", fontSize: 11 },
  cardMeta: { color: "#475569", fontSize: 11, fontWeight: "600" },
  cardDate: { color: "#2a2a4a", fontSize: 11 },
});
