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
    height: Math.floor(width * 0.85),
    minWidth: 400,
    minHeight: 300,
    frame: false,
    transparent: false,
    backgroundColor: '#1a1a1a',
    resizable: true,
    hasShadow: true,
    // This helps prevent the window from being captured in some scenarios
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  })

  // In development, load from Vite dev server
  // Check if VITE_DEV_SERVER_URL is set (only set when running npm run dev)
  const devServerUrl = process.env.VITE_DEV_SERVER_URL

  if (devServerUrl) {
    // Development mode with Vite dev server
    console.log('Loading from Vite dev server:', devServerUrl)
    mainWindow.loadURL(devServerUrl)
    mainWindow.webContents.openDevTools()
  } else {
    // Production mode - load from built files
    const indexPath = path.join(__dirname, '../dist/index.html')
    console.log('Loading from built files:', indexPath)
    mainWindow.loadFile(indexPath)
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Enable content protection by default to hide from screen recording
  mainWindow.setContentProtection(true)

  // macOS-specific: Hide window buttons for frameless window
  if (process.platform === 'darwin') {
    mainWindow.setWindowButtonVisibility(false)
  }
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

// Window control handlers
ipcMain.handle('window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize()
    return true
  }
  return false
})

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
    return true
  }
  return false
})

ipcMain.handle('window-close', () => {
  if (mainWindow) {
    mainWindow.close()
    return true
  }
  return false
})

ipcMain.handle('is-window-maximized', () => {
  if (mainWindow) {
    return mainWindow.isMaximized()
  }
  return false
})

// AssemblyAI Token Generation
ipcMain.handle('create-assemblyai-token', async (_event, apiKey) => {
  try {
    const { AssemblyAI } = require('assemblyai')
    const client = new AssemblyAI({ apiKey })
    console.log('Generating AssemblyAI token with expires_in_seconds: 480')
    const token = await client.streaming.createTemporaryToken({
      expires_in_seconds: 480
    })
    console.log('AssemblyAI token generated successfully')
    return token
  } catch (error) {
    console.error('Error generating AssemblyAI token:', error)
    throw error
  }
})
