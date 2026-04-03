import AsyncStorage from "@react-native-async-storage/async-storage";

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

export async function clearBoard() {
  try { await AsyncStorage.removeItem(KEY); } catch {}
}

// Guarda en un archivo específico usando File System Access API (Chrome/Edge).
// Devuelve el FileSystemFileHandle para poder sobreescribir sin diálogo la próxima vez.
// Si existingHandle es null abre el diálogo "Guardar como".
export async function saveProject(data, existingHandle = null, startIn = null) {
  const payload = JSON.stringify(
    { meta: { savedAt: new Date().toISOString(), version: 1 }, ...data },
    null, 2
  );
  if (window.showSaveFilePicker) {
    let handle = existingHandle;
    if (!handle) {
      try {
        handle = await window.showSaveFilePicker({
          suggestedName: `gamedev-board-${new Date().toISOString().slice(0, 10)}.json`,
          types: [{ description: "Proyecto GameDev Board", accept: { "application/json": [".json"] } }],
          ...(startIn ? { startIn } : {}),
        });
      } catch {
        return null; // usuario canceló
      }
    }
    const writable = await handle.createWritable();
    await writable.write(payload);
    await writable.close();
    return handle;
  }
  // Fallback para Firefox/Safari: descarga normal
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gamedev-board-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  return null;
}

export async function pickFolder() {
  try {
    return await window.showDirectoryPicker({ mode: "readwrite" });
  } catch { return null; }
}

export async function listProjects(dirHandle) {
  const projects = [];
  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind !== "file" || !name.endsWith(".json")) continue;
    try {
      const file = await handle.getFile();
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.cards)) continue;
      projects.push({
        name: name.replace(/\.json$/, ""),
        handle,
        cardCount: data.cards.length,
        savedAt: data.meta?.savedAt ?? null,
        typeCounts: {
          note:      data.cards.filter((c) => c.type === "note").length,
          checklist: data.cards.filter((c) => c.type === "checklist").length,
          image:     data.cards.filter((c) => c.type === "image").length,
        },
      });
    } catch {}
  }
  return projects.sort((a, b) => (b.savedAt ?? "").localeCompare(a.savedAt ?? ""));
}

export async function loadProject(fileHandle) {
  const file = await fileHandle.getFile();
  return JSON.parse(await file.text());
}

export async function exportBoard(data) {
  const date = new Date().toISOString().slice(0, 10);
  const name = `gamedev-board-${date}.json`;
  const payload = JSON.stringify(
    { meta: { name, exportedAt: new Date().toISOString(), version: 1 }, ...data },
    null,
    2
  );
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBoard() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) { resolve(null); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (!data.cards || !Array.isArray(data.cards)) {
            alert("❌ El archivo no es un board válido.");
            resolve(null);
            return;
          }
          resolve(data);
        } catch {
          alert("Error al leer el archivo.");
          resolve(null);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}
