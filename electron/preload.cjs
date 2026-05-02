const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopApp', {
  platform: process.platform,
  version: process.versions.electron,
  print: () => ipcRenderer.invoke('print-receipt'),
});
