import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  git: {
    initialize: (repoPath: string) => ipcRenderer.invoke('git:initialize', repoPath),
    status: () => ipcRenderer.invoke('git:status'),
    diff: (options: { staged?: boolean }) => ipcRenderer.invoke('git:diff', options),
    fileDiff: (filePath: string, staged: boolean) => ipcRenderer.invoke('git:fileDiff', filePath, staged),
    stage: (filePath: string) => ipcRenderer.invoke('git:stage', filePath),
    unstage: (filePath: string) => ipcRenderer.invoke('git:unstage', filePath),
  },
  selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
});