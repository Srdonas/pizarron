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

export default function CardChecklist({ card, isEdit, onUpdate, onBlur }) {
  const items = card.items || [];
  const done = items.filter((i) => i.done).length;

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
          style={styles.titleInput}
          value={card.title || ""}
          onChangeText={(t) => onUpdate({ title: t })}
          placeholder="Nombre de la lista"
          placeholderTextColor="rgba(0,0,0,0.35)"
        />
      ) : (
        <Text style={styles.title}>{card.title || "Lista"}</Text>
      )}

      <Text style={styles.counter}>
        {done}/{items.length} completados
      </Text>

      {items.map((item) => (
        <View key={item.id} style={styles.row}>
          <TouchableOpacity
            onPress={() => updItem(item.id, { done: !item.done })}
            style={[styles.checkbox, item.done && styles.checkboxDone]}
          >
            {item.done && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>

          {isEdit ? (
            <TextInput
              style={[styles.itemInput, item.done && styles.itemDone]}
              value={item.text}
              onChangeText={(t) => updItem(item.id, { text: t })}
              placeholder="Elemento..."
              placeholderTextColor="rgba(0,0,0,0.3)"
              onBlur={onBlur}
            />
          ) : (
            <Text style={[styles.itemText, item.done && styles.itemDone]}>
              {item.text || "..."}
            </Text>
          )}

          {isEdit && (
            <TouchableOpacity
              onPress={() => delItem(item.id)}
              style={styles.delBtn}
            >
              <Text style={styles.delText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {isEdit && (
        <TouchableOpacity onPress={addItem} style={styles.addBtn}>
          <Text style={styles.addText}>+ Agregar elemento</Text>
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
    borderBottomColor: "rgba(0,0,0,0.18)",
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
    borderColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: { backgroundColor: "#6366f1", borderColor: "#6366f1" },
  checkmark: { color: "white", fontSize: 11, fontWeight: "700" },
  itemInput: {
    flex: 1,
    fontSize: 13,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.12)",
  },
  itemText: { flex: 1, fontSize: 13, lineHeight: 20 },
  itemDone: { textDecorationLine: "line-through", opacity: 0.4 },
  delBtn: { padding: 2 },
  delText: { fontSize: 11, opacity: 0.35 },
  addBtn: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(0,0,0,0.2)",
    borderRadius: 7,
    padding: 6,
    marginTop: 6,
    alignItems: "center",
  },
  addText: { fontSize: 12, opacity: 0.5 },
});
