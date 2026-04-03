import { Platform, StyleSheet, Text, TextInput, View } from "react-native";

export default function CardNote({ card, fg = "#78350f", isEdit, onUpdate, onBlur }) {
  // Semi-transparent versions of fg for placeholders and borders
  const fgFaint = fg + "59"; // ~35% opacity
  const fgSubtle = fg + "2E"; // ~18% opacity

  if (isEdit)
    return (
      <View {...(Platform.OS === "web" ? { onPointerDown: (e) => e.stopPropagation() } : {})}>
        <TextInput
          style={[styles.titleInput, { color: fg, borderBottomColor: fgSubtle }]}
          placeholder="Título (opcional)"
          placeholderTextColor={fgFaint}
          value={card.title || ""}
          onChangeText={(t) => onUpdate({ title: t })}
          autoFocus
          returnKeyType="next"
          onSubmitEditing={() => {}}
        />
        <TextInput
          style={[styles.bodyInput, { color: fg }]}
          placeholder="Escribe tu idea aquí..."
          placeholderTextColor={fgFaint}
          value={card.body || ""}
          onChangeText={(t) => onUpdate({ body: t })}
          multiline
          onBlur={onBlur}
        />
      </View>
    );

  return (
    <View>
      {card.title ? <Text style={[styles.title, { color: fg }]}>{card.title}</Text> : null}
      <Text style={[styles.body, { color: fg, opacity: card.body ? 1 : 0.35 }]}>
        {card.body || "Toca para editar..."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titleInput: {
    fontSize: 14,
    fontWeight: "600",
    borderBottomWidth: 1.5,
    paddingBottom: 4,
    marginBottom: 10,
  },
  bodyInput: {
    fontSize: 13,
    lineHeight: 20,
    minHeight: 70,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    lineHeight: 20,
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
  },
});
