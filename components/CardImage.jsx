import * as ImagePicker from "expo-image-picker";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CardImage({ card, isEdit, isSel, onUpdate, onBlur }) {
  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: false,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const MAX_W = 400;
      const ratio = asset.width > MAX_W ? MAX_W / asset.width : 1;
      onUpdate({
        url: asset.uri,
        w:    Math.round(asset.width  * ratio),
        imgH: Math.round(asset.height * ratio),
        caption: card.caption || "",
      });
    }
  }

  if (isEdit)
    return (
      <View>
        <TouchableOpacity onPress={pickImage} style={styles.dropzone}>
          {card.url ? (
            <>
              <Image
                source={{ uri: card.url }}
                style={styles.preview}
                resizeMode="cover"
              />
              <Text style={styles.changeText}>Toca para cambiar</Text>
            </>
          ) : (
            <>
              <Text style={styles.icon}>📁</Text>
              <Text style={styles.hint}>Toca para elegir imagen</Text>
            </>
          )}
        </TouchableOpacity>
        <TextInput
          style={styles.captionInput}
          placeholder="Descripción (opcional)"
          placeholderTextColor="rgba(0,0,0,0.3)"
          value={card.caption || ""}
          onChangeText={(t) => onUpdate({ caption: t })}
          onBlur={onBlur}
        />
      </View>
    );

  return (
    <View>
      {card.url ? (
        <Image
          source={{ uri: card.url }}
          style={[styles.image, card.imgH && { height: card.imgH }]}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.icon}>🖼</Text>
          <Text style={styles.emptyText}>Toca dos veces para subir</Text>
        </View>
      )}
      {card.caption ? <Text style={styles.caption}>{card.caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dropzone: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(0,0,0,0.2)",
    borderRadius: 9,
    padding: 16,
    alignItems: "center",
    marginBottom: 8,
  },
  preview: { width: "100%", height: 120, borderRadius: 6, marginBottom: 6 },
  changeText: { fontSize: 11, opacity: 0.5 },
  icon: { fontSize: 28, marginBottom: 6 },
  hint: { fontSize: 12, opacity: 0.6 },
  captionInput: {
    fontSize: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.15)",
    paddingBottom: 4,
  },
  image: { width: "100%", height: 210, borderRadius: 8, marginBottom: 4 },
  empty: {
    height: 90,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "rgba(0,0,0,0.2)",
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  emptyText: { fontSize: 12, opacity: 0.3 },
  caption: { fontSize: 11, opacity: 0.65, marginTop: 4, lineHeight: 16 },
});
