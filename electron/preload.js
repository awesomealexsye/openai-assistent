const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    setAlwaysOnTop: (flag) => ipcRenderer.invoke('set-always-on-top', flag),
    setOpacity: (opacity) => ipcRenderer.invoke('set-opacity', opacity),
    getScreenSharingStatus: () => ipcRenderer.invoke('get-screen-sharing-status'),
    setContentProtection: (enable) => ipcRenderer.invoke('set-content-protection', enable),
    checkMicrophonePermission: () => ipcRenderer.invoke('check-microphone-permission'),
    requestMicrophonePermission: () => ipcRenderer.invoke('request-microphone-permission'),
    openSystemPreferencesSecurity: () => ipcRenderer.invoke('open-system-preferences-security'),
    windowMinimize: () => ipcRenderer.invoke('window-minimize'),
    windowMaximize: () => ipcRenderer.invoke('window-maximize'),
    windowClose: () => ipcRenderer.invoke('window-close'),
    isWindowMaximized: () => ipcRenderer.invoke('is-window-maximized'),
})
