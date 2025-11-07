// Note: When running inside Electron, the 'electron' module provides the APIs directly
// The npm 'electron' package only provides a path to the binary for launching
const { app, BrowserWindow, ipcMain, screen } = require('electron')
const path = require('path')

let mainWindow = null

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

app.whenReady().then(() => {
  createWindow()

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
