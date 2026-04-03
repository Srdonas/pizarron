import { useRef, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

const MAX_W = 400;

function calcDimensions(naturalW, naturalH) {
  const ratio = naturalW > MAX_W ? MAX_W / naturalW : 1;
  return {
    w:    Math.round(naturalW * ratio),
    imgH: Math.round(naturalH * ratio),
  };
}

function processFile(file, currentCaption, onUpdate) {
  if (!file || !file.type.startsWith("image/")) return;
  const blobUrl = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const dims = calcDimensions(img.naturalWidth, img.naturalHeight);
    // Redimensionar al tamaño de visualización con canvas → JPEG comprimido (~30–80 KB)
    // Así la imagen queda embebida en el JSON y sobrevive export/import
    const canvas = document.createElement("canvas");
    canvas.width  = dims.w;
    canvas.height = dims.imgH;
    canvas.getContext("2d").drawImage(img, 0, 0, dims.w, dims.imgH);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    URL.revokeObjectURL(blobUrl);
    onUpdate({ url: dataUrl, caption: currentCaption || file.name.replace(/\.[^.]+$/, ""), ...dims });
  };
  img.src = blobUrl;
}

export default function CardImage({ card, isEdit, isSel, onUpdate, onBlur }) {
  const fileRef = useRef(null);
  const [draggingOver, setDraggingOver] = useState(false);

  if (isEdit) return (
    <View>
      {/* Drop zone */}
      <View
        style={[styles.dropzone, draggingOver && styles.dropzoneActive]}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDraggingOver(true); }}
        onDragLeave={() => setDraggingOver(false)}
        onDrop={(e) => {
          e.preventDefault(); e.stopPropagation();
          setDraggingOver(false);
          processFile(e.dataTransfer.files?.[0], card.caption, onUpdate);
        }}
      >
        {card.url ? (
          <>
            <img src={card.url} alt="" style={{ width: "100%", maxHeight: 120, objectFit: "cover", borderRadius: 6, display: "block", marginBottom: 6 }} />
            <Text style={styles.hint}>Click para cambiar imagen</Text>
          </>
        ) : (
          <>
            <Text style={styles.icon}>📁</Text>
            <Text style={styles.hint}>Click o arrastra una imagen aquí</Text>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => processFile(e.target.files?.[0], card.caption, onUpdate)}
        />
      </View>

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
        <img
          src={card.url}
          alt={card.caption || ""}
          style={{
            width: "100%",
            height: card.imgH ? `${card.imgH}px` : undefined,
            maxHeight: card.imgH ? undefined : 210,
            objectFit: "cover",
            borderRadius: 8,
            display: "block",
            marginBottom: card.caption ? 6 : 0,
          }}
        />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.icon}>🖼</Text>
          <Text style={styles.emptyText}>Doble click → subir imagen</Text>
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
    cursor: "pointer",
  },
  dropzoneActive: {
    borderColor: "#818cf8",
    backgroundColor: "rgba(129,140,248,0.05)",
  },
  hint: { fontSize: 11, opacity: 0.5 },
  icon: { fontSize: 28, marginBottom: 6 },
  captionInput: {
    fontSize: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.15)",
    paddingBottom: 4,
  },
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
