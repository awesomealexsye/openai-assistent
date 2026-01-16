const { app, BrowserWindow, ipcMain, systemPreferences, desktopCapturer, screen, globalShortcut } = require('electron')
const path = require('path')

let mainWindow

// Screenshot capture function
async function captureScreen() {
    try {
        // Check screen recording permission on macOS
        if (process.platform === 'darwin') {
            const status = systemPreferences.getMediaAccessStatus('screen')
            if (status !== 'granted') {
                // Try to trigger permission prompt by accessing sources
                // macOS will show permission dialog automatically
            }
        }

        // Get primary display info
        const primaryDisplay = screen.getPrimaryDisplay()
        const { width, height } = primaryDisplay.size
        const scaleFactor = primaryDisplay.scaleFactor

        // Get all screen sources
        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: {
                width: Math.floor(width * scaleFactor),
                height: Math.floor(height * scaleFactor)
            }
        })

        if (sources.length === 0) {
            return { success: false, error: 'No screen sources available' }
        }

        // Get the primary screen source
        const primarySource = sources[0]
        const thumbnail = primarySource.thumbnail

        // Convert to data URL (PNG format)
        const dataUrl = thumbnail.toDataURL()
        const size = thumbnail.getSize()

        return {
            success: true,
            dataUrl: dataUrl,
            width: size.width,
            height: size.height
        }
    } catch (error) {
        console.error('Screenshot capture error:', error)
        return { success: false, error: error.message }
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        titleBarStyle: 'hiddenInset',
        trafficLightPosition: { x: 20, y: 20 },
        backgroundColor: '#1a1a1a',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    })

    // Load the app
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
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

    // Register global shortcut for screenshot (Cmd+Shift+S on macOS, Ctrl+Shift+S on Windows/Linux)
    const shortcut = process.platform === 'darwin' ? 'Command+Shift+S' : 'Control+Shift+S'
    const registered = globalShortcut.register(shortcut, () => {
        if (mainWindow) {
            mainWindow.webContents.send('screenshot-shortcut-triggered')
        }
    })

    if (!registered) {
        console.warn('Screenshot shortcut registration failed')
    }

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

// Unregister all shortcuts when quitting
app.on('will-quit', () => {
    globalShortcut.unregisterAll()
})

// IPC Handlers
ipcMain.handle('set-always-on-top', async (event, flag) => {
    if (mainWindow) {
        mainWindow.setAlwaysOnTop(flag)
        return true
    }
    return false
})

ipcMain.handle('set-opacity', async (event, opacity) => {
    if (mainWindow) {
        mainWindow.setOpacity(opacity)
        return true
    }
    return false
})

ipcMain.handle('get-screen-sharing-status', async () => {
    return false // Placeholder
})

ipcMain.handle('set-content-protection', async (event, enable) => {
    if (mainWindow) {
        mainWindow.setContentProtection(enable)
        return true
    }
    return false
})

ipcMain.handle('check-microphone-permission', async () => {
    const status = systemPreferences.getMediaAccessStatus('microphone')
    return {
        status: status,
        granted: status === 'granted'
    }
})

ipcMain.handle('request-microphone-permission', async () => {
    try {
        const granted = await systemPreferences.askForMediaAccess('microphone')
        return granted
    } catch (error) {
        console.error('Error requesting microphone permission:', error)
        return false
    }
})

ipcMain.handle('open-system-preferences-security', async () => {
    const { shell } = require('electron')
    await shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone')
    return true
})

ipcMain.handle('window-minimize', async () => {
    if (mainWindow) {
        mainWindow.minimize()
        return true
    }
    return false
})

ipcMain.handle('window-maximize', async () => {
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

ipcMain.handle('window-close', async () => {
    if (mainWindow) {
        mainWindow.close()
        return true
    }
    return false
})

ipcMain.handle('is-window-maximized', async () => {
    if (mainWindow) {
        return mainWindow.isMaximized()
    }
    return false
})

ipcMain.handle('create-assemblyai-token', async (event, apiKey) => {
    try {
        const response = await fetch('https://api.assemblyai.com/v2/realtime/token', {
            method: 'POST',
            headers: {
                'authorization': apiKey,
                'content-type': 'application/json',
            },
            body: JSON.stringify({ expires_in: 3600 }),
        })

        if (!response.ok) {
            throw new Error(`AssemblyAI API error: ${response.statusText}`)
        }

        const data = await response.json()
        return data.token
    } catch (error) {
        console.error('Error creating AssemblyAI token:', error)
        throw error
    }
})

// Screenshot capture handler
ipcMain.handle('capture-screenshot', async () => {
    return await captureScreen()
})
