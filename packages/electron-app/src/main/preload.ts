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
  claudeIntegration: {
    startSession: (workingDir: string) => ipcRenderer.invoke('claude-integration:start-session', workingDir),
    stopSession: (workingDir: string) => ipcRenderer.invoke('claude-integration:stop-session', workingDir),
    getSessions: () => ipcRenderer.invoke('claude-integration:get-sessions'),
    toggleAutoShowDiff: (enabled: boolean) => ipcRenderer.invoke('claude-integration:toggle-auto-diff', enabled),
  },
  selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
  on: (channel: string, callback: Function) => {
    const validChannels = ['claude-code:file-changed', 'claude-code:iteration-complete', 'claude-code:trigger-refresh'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
  removeListener: (channel: string, callback: Function) => {
    ipcRenderer.removeListener(channel, callback);
  },
});