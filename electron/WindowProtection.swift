import Cocoa
import Foundation

@objc class WindowProtection: NSObject {

    /// Sets the window sharing type to prevent screen recording
    @objc static func disableScreenCapture(forWindowNumber windowNumber: Int) {
        guard let windows = CGWindowListCopyWindowInfo([.optionOnScreenOnly], kCGNullWindowID) as? [[String: Any]] else {
            return
        }

        // Find our window
        for windowInfo in windows {
            if let windowNum = windowInfo[kCGWindowNumber as String] as? Int,
               windowNum == windowNumber {

                // Get the NSWindow from the window number
                if let window = NSApp.window(withWindowNumber: windowNumber) {
                    // Set sharing type to NSWindowSharingNone
                    window.sharingType = .none
                    print("Window sharing disabled for window \(windowNumber)")
                }
                break
            }
        }
    }

    /// Enables screen capture for the window
    @objc static func enableScreenCapture(forWindowNumber windowNumber: Int) {
        if let window = NSApp.window(withWindowNumber: windowNumber) {
            window.sharingType = .readOnly
            print("Window sharing enabled for window \(windowNumber)")
        }
    }
}

// Export functions for command-line usage
if CommandLine.argc > 1 {
    let command = CommandLine.arguments[1]

    switch command {
    case "disable":
        if CommandLine.argc > 2, let windowNum = Int(CommandLine.arguments[2]) {
            WindowProtection.disableScreenCapture(forWindowNumber: windowNum)
        }
    case "enable":
        if CommandLine.argc > 2, let windowNum = Int(CommandLine.arguments[2]) {
            WindowProtection.enableScreenCapture(forWindowNumber: windowNum)
        }
    default:
        print("Usage: WindowProtection [disable|enable] [windowNumber]")
    }
}
