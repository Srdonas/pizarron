import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

const KEY = "gd-board-v1";

export async function loadBoard() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveBoard(data) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Error saving:", e);
  }
}

// ── NUEVO: Exportar ──
export async function exportBoard(data) {
  try {
    const date = new Date().toISOString().slice(0, 10);
    const name = `gamedev-board-${date}.json`;
    const path = FileSystem.cacheDirectory + name;
    const payload = JSON.stringify(
      {
        meta: { name, exportedAt: new Date().toISOString(), version: 1 },
        ...data,
      },
      null,
      2,
    );

    await FileSystem.writeAsStringAsync(path, payload, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(path, {
        mimeType: "application/json",
        dialogTitle: "Exportar board",
      });
    } else {
      alert("Compartir no está disponible en este dispositivo.");
    }
  } catch (e) {
    console.warn("Error exportando:", e);
    alert("Error al exportar el board.");
  }
}

// Stubs — estas funciones solo están implementadas en useStorage.web.js
export async function clearBoard() {}
export async function saveProject() { return null; }
export async function pickFolder() { return null; }
export async function listProjects() { return []; }
export async function loadProject() { return null; }

// ── NUEVO: Importar ──
export async function importBoard() {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
    });

    if (result.canceled) return null;

    const raw = await FileSystem.readAsStringAsync(result.assets[0].uri);
    const data = JSON.parse(raw);

    if (!data.cards || !Array.isArray(data.cards)) {
      alert("❌ El archivo no es un board válido.");
      return null;
    }

    return data;
  } catch (e) {
    console.warn("Error importando:", e);
    alert("Error al leer el archivo.");
    return null;
  }
}
