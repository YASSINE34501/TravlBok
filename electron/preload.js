// Intentionally minimal: TravlBok runs entirely as the normal web app inside
// the BrowserWindow (contextIsolation + sandbox both on, nodeIntegration
// off), so no Node/Electron APIs need to be exposed to the page. This file
// exists as the designated place to add a contextBridge API in the future
// if a native-only feature (e.g. native file dialogs) is ever needed.
