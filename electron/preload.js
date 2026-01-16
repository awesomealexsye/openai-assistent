const { contextBridge, ipcRenderer } = require('electron')

// Store callbacks for cleanup
let screenshotShortcutCallback = null
let clickThroughToggleCallback = null

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
    createAssemblyAiToken: (apiKey) => ipcRenderer.invoke('create-assemblyai-token', apiKey),

    // Screenshot APIs
    captureScreenshot: () => ipcRenderer.invoke('capture-screenshot'),
    onScreenshotShortcut: (callback) => {
        // Remove previous listener if exists
        if (screenshotShortcutCallback) {
            ipcRenderer.removeListener('screenshot-shortcut-triggered', screenshotShortcutCallback)
        }
        screenshotShortcutCallback = callback
        ipcRenderer.on('screenshot-shortcut-triggered', callback)
    },
    removeScreenshotShortcutListener: () => {
        if (screenshotShortcutCallback) {
            ipcRenderer.removeListener('screenshot-shortcut-triggered', screenshotShortcutCallback)
            screenshotShortcutCallback = null
        }
    },

    // Exam Mode API - stealth mode for tests
    setExamMode: (enabled) => ipcRenderer.invoke('set-exam-mode', enabled),

    // Click-through mode - clicks pass through to Chrome (true stealth)
    setClickThrough: (enabled) => ipcRenderer.invoke('set-click-through', enabled),

    // Click-through toggle listener (for keyboard shortcut)
    onClickThroughToggle: (callback) => {
        if (clickThroughToggleCallback) {
            ipcRenderer.removeListener('click-through-toggle', clickThroughToggleCallback)
        }
        clickThroughToggleCallback = callback
        ipcRenderer.on('click-through-toggle', callback)
    },
    removeClickThroughToggleListener: () => {
        if (clickThroughToggleCallback) {
            ipcRenderer.removeListener('click-through-toggle', clickThroughToggleCallback)
            clickThroughToggleCallback = null
        }
    },
})
