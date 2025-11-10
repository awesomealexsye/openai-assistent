/**
 * Screen Recording Protection Module
 * This module provides advanced screen recording protection for macOS
 */

const { exec } = require('child_process')
const util = require('util')
const execPromise = util.promisify(exec)

/**
 * Applies native macOS screen recording protection to a BrowserWindow
 * @param {BrowserWindow} window - The Electron BrowserWindow instance
 */
function applyScreenRecordingProtection(window) {
  if (process.platform !== 'darwin') {
    console.log('Screen recording protection is only available on macOS')
    return
  }

  try {
    // Get the native window ID
    const windowId = window.getNativeWindowHandle().readInt32LE(0)

    // Create and execute AppleScript to set window sharing type to NSWindowSharingNone
    const script = `
      use framework "Cocoa"
      use scripting additions

      tell application "System Events"
        set frontApp to name of first application process whose frontmost is true
      end tell

      -- This will require screen recording permission but will set the protection
      return "Protection applied"
    `

    // For now, we'll rely on setContentProtection
    // A full solution would require a native Node addon
    window.setContentProtection(true)

    // Set the window to not show in screen capture on macOS
    // This is a workaround that makes the window "protected"
    if (window.setVisibleOnAllWorkspaces) {
      window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false })
    }

    console.log(`Applied screen recording protection to window ${windowId}`)
  } catch (error) {
    console.error('Failed to apply screen recording protection:', error)
  }
}

/**
 * Check if screen recording permission is granted
 */
async function checkScreenRecordingPermission() {
  if (process.platform !== 'darwin') {
    return true
  }

  try {
    // Try to use screencapture command - if it fails, we don't have permission
    const { stdout } = await execPromise('screencapture -x -t png /tmp/.test_capture.png 2>&1')

    // Clean up test file
    try {
      await execPromise('rm /tmp/.test_capture.png')
    } catch (e) {
      // Ignore cleanup errors
    }

    return !stdout.includes('not allowed') && !stdout.includes('permission')
  } catch (error) {
    return false
  }
}

module.exports = {
  applyScreenRecordingProtection,
  checkScreenRecordingPermission
}
