import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function CardChecklist({ card, fg = "#78350f", isEdit, onUpdate, onBlur }) {
  const items = card.items || [];
  const done = items.filter((i) => i.done).length;

  // Semi-transparent versions of fg
  const fgFaint = fg + "59";  // ~35% opacity
  const fgSubtle = fg + "40"; // ~25% opacity
  const fgGhost = fg + "1F";  // ~12% opacity

  function addItem() {
    onUpdate({ items: [...items, { id: uid(), text: "", done: false }] });
  }
  function updItem(id, patch) {
    onUpdate({
      items: items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    });
  }
  function delItem(id) {
    onUpdate({ items: items.filter((i) => i.id !== id) });
  }

  return (
    <View>
      {isEdit ? (
        <TextInput
          style={[styles.titleInput, { color: fg, borderBottomColor: fg + "2E" }]}
          value={card.title || ""}
          onChangeText={(t) => onUpdate({ title: t })}
          placeholder="Nombre de la lista"
          placeholderTextColor={fgFaint}
        />
      ) : (
        <Text style={[styles.title, { color: fg }]}>{card.title || "Lista"}</Text>
      )}

      <Text style={[styles.counter, { color: fg }]}>
        {done}/{items.length} completados
      </Text>

      {items.map((item) => (
        <View key={item.id} style={styles.row}>
          <TouchableOpacity
            onPress={() => updItem(item.id, { done: !item.done })}
            style={[styles.checkbox, { borderColor: fgSubtle }, item.done && styles.checkboxDone]}
          >
            {item.done && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>

          {isEdit ? (
            <TextInput
              style={[styles.itemInput, { color: fg, borderBottomColor: fgGhost }, item.done && styles.itemDone]}
              value={item.text}
              onChangeText={(t) => updItem(item.id, { text: t })}
              placeholder="Elemento..."
              placeholderTextColor={fg + "4D"}
              onBlur={onBlur}
            />
          ) : (
            <Text style={[styles.itemText, { color: fg }, item.done && styles.itemDone]}>
              {item.text || "..."}
            </Text>
          )}

          {isEdit && (
            <TouchableOpacity
              onPress={() => delItem(item.id)}
              style={styles.delBtn}
            >
              <Text style={[styles.delText, { color: fg }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {isEdit && (
        <TouchableOpacity onPress={addItem} style={[styles.addBtn, { borderColor: fg + "33" }]}>
          <Text style={[styles.addText, { color: fg }]}>+ Agregar elemento</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  titleInput: {
    fontSize: 14,
    fontWeight: "600",
    borderBottomWidth: 1.5,
    paddingBottom: 4,
    marginBottom: 8,
  },
  title: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  counter: { fontSize: 10, opacity: 0.45, marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 7, gap: 8 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: { backgroundColor: "#6366f1", borderColor: "#6366f1" },
  checkmark: { color: "white", fontSize: 11, fontWeight: "700" },
  itemInput: {
    flex: 1,
    fontSize: 13,
    borderBottomWidth: 1,
  },
  itemText: { flex: 1, fontSize: 13, lineHeight: 20 },
  itemDone: { textDecorationLine: "line-through", opacity: 0.4 },
  delBtn: { padding: 2 },
  delText: { fontSize: 11, opacity: 0.35 },
  addBtn: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 7,
    padding: 6,
    marginTop: 6,
    alignItems: "center",
  },
  addText: { fontSize: 12, opacity: 0.5 },
});
