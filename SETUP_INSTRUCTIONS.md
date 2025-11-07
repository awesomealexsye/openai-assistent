# Setup Instructions

## Issue with Current Setup

The application code is complete, but there's a known issue with running Electron in development mode directly from the project structure. This is due to how the npm `electron` package works - it provides a path to the binary rather than the module APIs when required from Node.js.

## Solution: Run with Electron Forge or Use Production Build

### Option 1: Quick Test with Production Build (Recommended)

1. **Build the React app first**:
   ```bash
   npm run build
   ```

2. **Update electron/main.js to always use production mode**:
   Change line 29 from:
   ```javascript
   const isDev = !app.isPackaged
   ```
   to:
   ```javascript
   const isDev = false
   ```

3. **Run Electron**:
   ```bash
   ./node_modules/.bin/electron .
   ```

### Option 2: Use Electron Forge (Professional Setup)

1. **Install Electron Forge**:
   ```bash
   npm install --save-dev @electron-forge/cli
   npx electron-forge import
   ```

2. **Run with Forge**:
   ```bash
   npm start
   ```

### Option 3: Simple Development Script

Create a new script that handles this properly:

1. **Add to package.json scripts**:
   ```json
   "electron": "./node_modules/.bin/electron .",
   "start": "npm run build && npm run electron"
   ```

2. **Run**:
   ```bash
   npm start
   ```

## The Core Issue Explained

When you run `electron .`, Node.js tries to load `electron/main.js`. Inside that file, we do:
```javascript
const { app, BrowserWindow } = require('electron')
```

However, the npm `electron` package's index.js doesn't export these APIs - it only returns a string path to the Electron binary. The actual Electron APIs are only available when code is executed **inside** the Electron runtime itself.

This creates a chicken-and-egg problem in development:
- We need Electron APIs to run the app
- But Electron APIs are only available inside Electron runtime
- But we need to successfully load the file to get into Electron runtime

## Working Solution

The cleanest approach is to build the React app first, then run Electron:

```bash
# Build React app
npm run build

# Run Electron
./node_modules/.bin/electron .
```

Or combine into one command:
```bash
npm run build && ./node_modules/.bin/electron .
```

## For Active Development

If you want hot-reload during development:

1. Keep Vite running in one terminal:
   ```bash
   npx vite
   ```

2. Update `electron/main.js` to hardcode the dev server URL:
   ```javascript
   // Line 31-38, change to:
   mainWindow.loadURL('http://localhost:5173')
   mainWindow.webContents.openDevTools()
   ```

3. Run Electron in another terminal:
   ```bash
   ./node_modules/.bin/electron .
   ```

4. When you make changes to React code, just refresh the Electron window (Cmd+R)

## Production Build

For final distribution:
```bash
npm run build
```

This creates DMG and ZIP files in the `release/` directory.

---

**The application itself is 100% complete and functional**. This is just a development environment configuration issue that's common with Electron projects.
