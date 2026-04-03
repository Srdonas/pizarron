# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run start      # Start Expo dev server (then press w for web, a for Android, i for iOS)
npm run web        # Run directly in browser
npm run android    # Run on Android emulator
npm run ios        # Run on iOS simulator
npm run lint       # Run ESLint
```

There are no tests in this project.

## Architecture

**GameDev Board** is a cross-platform (iOS, Android, Web) collaborative canvas app where users place and arrange cards on an infinite draggable board. Built with Expo + expo-router.

### Routing
Single-screen app via expo-router. `app/_layout.js` wraps everything in `GestureHandlerRootView` + Stack navigator. `app/index.jsx` is the only route — it renders `ProjectBrowser` on web or the board directly on mobile.

### State
All state lives in `app/index.jsx` with React hooks. No external state manager. Key refs (`projectFileRef`, `handleSaveRef`, `canvasTopRef`) are used to avoid stale closures in gesture callbacks.

### Persistence
Platform-split via Metro's resolver:
- `hooks/useStorage.js` — mobile: AsyncStorage (key `"gd-board-v1"`) + `expo-sharing` for export
- `hooks/useStorage.web.js` — web: File System Access API with localStorage fallback; `ProjectBrowser.jsx` handles folder browsing

### Gestures & Animations
- `react-native-reanimated` for canvas transforms (pan/zoom) and card positions
- `react-native-gesture-handler` for multi-touch: Gesture.Race/Simultaneous to prevent conflicts between card drag, canvas pan, and pinch-zoom
- Web uses mouse events (wheel zoom, click drag) instead of gesture handler

### Platform Branching
`Platform.OS === "web"` is used throughout. Files with `.web.jsx` suffix (e.g. `CardImage.web.jsx`) are automatically resolved for web by Metro.

### Data Model

```js
{
  meta: { savedAt: ISO_DATE, version: 1 },
  cards: [
    {
      id: string,
      type: "note" | "checklist" | "image",
      x: number, y: number,       // canvas position
      color: "amber"|"sky"|"emerald"|"rose"|"violet"|"slate",
      // note: title, body
      // checklist: title, items: [{id, text, done}]
      // image: url (data URL), caption, w, imgH
    }
  ],
  offset: { x, y },   // canvas pan
  scale: number,       // zoom 0.2–3
}
```

### Key Components
- `app/index.jsx` — main board: canvas, toolbar, card rendering, gesture setup (~785 lines)
- `components/CardNote.jsx`, `CardChecklist.jsx`, `CardImage.jsx` — individual card types
- `components/ProjectBrowser.jsx` — web-only project file browser
- `constants/palettes.js` — 6 color themes used across all cards

### Web-specific Features
- Keyboard shortcuts: `Escape` deselects, `Delete`/`Backspace` removes selected card, `Ctrl/Cmd+S` saves
- Image cards: canvas-based resize to 400px wide + JPEG compression (~30–80KB) embedded as data URL
- Vertical resize handle on image cards
- Zoom controls in toolbar

### Important Notes
- `babel.config.js` must include `react-native-reanimated/plugin` (required for Reanimated)
- New Architecture (`newArchEnabled: true`) and React Compiler are enabled in `app.json`
- UI labels are in Spanish
- Path alias `@/*` maps to project root (configured in `tsconfig.json`)
