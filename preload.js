'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('voidWeaverDesktop', {
  isDesktop: true,
  quit: () => ipcRenderer.send('desktop:quit')
});
