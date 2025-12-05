const { app, BrowserWindow, ipcMain, systemPreferences } = require('electron')
const path = require('path')

let mainWindow

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
