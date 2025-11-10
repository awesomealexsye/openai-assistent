// Note: When running inside Electron, the 'electron' module provides the APIs directly
// The npm 'electron' package only provides a path to the binary for launching
const { app, BrowserWindow, ipcMain, screen, systemPreferences, shell } = require('electron')
const path = require('path')

let mainWindow = null

// Function to request microphone permission on macOS
async function requestMicrophonePermission() {
  if (process.platform === 'darwin') {
    try {
      const status = systemPreferences.getMediaAccessStatus('microphone')
      console.log('Current microphone permission status:', status)

      if (status === 'not-determined') {
        console.log('Requesting microphone access...')
        // askForMediaAccess will trigger the system permission dialog
        const granted = await systemPreferences.askForMediaAccess('microphone')
        console.log('Microphone permission granted:', granted)
        return granted
      }

      return status === 'granted'
    } catch (error) {
      console.error('Error requesting microphone permission:', error)
      return false
    }
  }
  return true // Non-macOS platforms
}

// Function to check microphone permission status
function checkMicrophonePermission() {
  if (process.platform === 'darwin') {
    const status = systemPreferences.getMediaAccessStatus('microphone')
    return {
      status: status,
      granted: status === 'granted'
    }
  }
  return { status: 'granted', granted: true } // Non-macOS platforms
}

const createWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  mainWindow = new BrowserWindow({
    width: Math.floor(width * 0.8),
    height: Math.floor(height * 0.85),
    minWidth: 1000,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
    backgroundColor: '#1a1a1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  })

  // In development, load from Vite dev server
  // Check if we're in development by looking for common dev indicators
  const isDev = !app.isPackaged

  if (isDev) {
    // Vite dev server - try different ports in case of conflicts
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
    mainWindow.loadURL(devServerUrl)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(async () => {
  createWindow()

  // Request microphone permission after window is created
  // This ensures the renderer process can trigger the actual microphone access
  setTimeout(async () => {
    const permissionStatus = checkMicrophonePermission()
    console.log('Microphone permission on startup:', permissionStatus)

    if (permissionStatus.status === 'not-determined') {
      console.log('Permission not determined, will prompt on first use')
      // Don't request here - let the user trigger it from Settings or when recording
      // This ensures the native dialog appears in context
    }
  }, 1000)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC handlers for window controls
ipcMain.handle('set-always-on-top', (_event, flag) => {
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(flag, 'floating')
    return true
  }
  return false
})

ipcMain.handle('set-opacity', (_event, opacity) => {
  if (mainWindow) {
    mainWindow.setOpacity(opacity)
    return true
  }
  return false
})

ipcMain.handle('get-screen-sharing-status', () => {
  return false
})

ipcMain.handle('set-content-protection', (_event, enable) => {
  if (mainWindow) {
    mainWindow.setContentProtection(enable)
    return true
  }
  return false
})

// IPC handlers for microphone permissions
ipcMain.handle('check-microphone-permission', () => {
  return checkMicrophonePermission()
})

ipcMain.handle('request-microphone-permission', async () => {
  return await requestMicrophonePermission()
})

// Open System Preferences for microphone settings
ipcMain.handle('open-system-preferences-security', async () => {
  if (process.platform === 'darwin') {
    // macOS 13+ uses new Settings app, older versions use System Preferences
    await shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone')
  }
  return true
})
