import { Platform, StyleSheet, Text, TextInput, View } from "react-native";

export default function CardNote({ card, isEdit, onUpdate, onBlur }) {
  if (isEdit)
    return (
      <View {...(Platform.OS === "web" ? { onPointerDown: (e) => e.stopPropagation() } : {})}>
        <TextInput
          style={[styles.titleInput, { color: "inherit" }]}
          placeholder="Título (opcional)"
          placeholderTextColor="rgba(0,0,0,0.35)"
          value={card.title || ""}
          onChangeText={(t) => onUpdate({ title: t })}
          autoFocus // ← muévelo aquí
          returnKeyType="next" // ← bonus: teclado muestra "siguiente"
          onSubmitEditing={() => {}} // ← al presionar enter no cierra el teclado
        />
        <TextInput
          style={[styles.bodyInput, { color: "inherit" }]}
          placeholder="Escribe tu idea aquí..."
          placeholderTextColor="rgba(0,0,0,0.35)"
          value={card.body || ""}
          onChangeText={(t) => onUpdate({ body: t })}
          multiline
          // ← quita el autoFocus de aquí
          onBlur={onBlur}
        />
      </View>
    );

  return (
    <View>
      {card.title ? <Text style={styles.title}>{card.title}</Text> : null}
      <Text style={[styles.body, { opacity: card.body ? 1 : 0.35 }]}>
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
    borderBottomColor: "rgba(0,0,0,0.18)",
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
