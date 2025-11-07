# Project Verification Checklist

Use this checklist to verify that the AI Meeting Assistant application is working correctly.

## Pre-Flight Checks

- [x] All dependencies installed (`node_modules/` exists)
- [x] TypeScript compiles without errors
- [x] Configuration files in place (tsconfig, vite, tailwind, etc.)
- [x] Electron files created (`electron/main.js`, `electron/preload.js`)
- [x] React components created (6 components in `src/components/`)
- [x] Services created (OpenAI, Voice)
- [x] State management set up (Zustand store)
- [x] Database layer implemented (IndexedDB)
- [x] Type definitions complete
- [x] Documentation written (README, QUICK_START, PROJECT_SUMMARY)

## Running the Application

### Step 1: Start Development Server
```bash
npm run dev
```

**Expected Result:**
- Vite server starts on http://localhost:5173 (or 5174 if 5173 is busy)
- Electron window launches automatically
- Window has macOS traffic lights (red, yellow, green buttons)
- Window shows the app interface

### Step 2: First Launch Verification

Check that you see:
- [ ] Three-panel layout: Sidebar | Chat | Canvas
- [ ] "New Chat" button in sidebar
- [ ] "Settings" button at bottom of sidebar
- [ ] "No chat selected" message in center
- [ ] "Code Canvas" panel on right with placeholder text

### Step 3: Settings Configuration

1. Click "Settings" button
   - [ ] Modal opens with dark glass-morphism design
   - [ ] See sections: API Configuration, Window Settings, Appearance

2. Configure API Key:
   - [ ] Enter API key field works
   - [ ] Eye icon toggles show/hide
   - [ ] "Test" button is enabled
   - [ ] Test button validates key (if you have a valid key)

3. Model Selection:
   - [ ] Dropdown shows: GPT-4 Turbo, GPT-4, GPT-3.5 Turbo
   - [ ] Can select different models

4. Temperature Slider:
   - [ ] Slider moves from 0.0 to 2.0
   - [ ] Current value displays

5. Max Tokens Slider:
   - [ ] Slider moves from 256 to 8192
   - [ ] Current value displays

6. Window Settings:
   - [ ] "Always on Top" toggle works
   - [ ] "Screen Protection" toggle works
   - [ ] "Window Opacity" slider adjusts window transparency

7. Theme:
   - [ ] Can switch between Dark and Light
   - [ ] UI updates to match theme

8. Save:
   - [ ] "Save Changes" button closes modal
   - [ ] Settings persist (reopen to verify)

### Step 4: Chat Functionality

1. Create New Chat:
   - [ ] Click "New Chat" in sidebar
   - [ ] New chat appears in sidebar
   - [ ] Chat title shows "New Chat"
   - [ ] Input box becomes active in center panel

2. Send Text Message:
   - [ ] Type a message (e.g., "Hello, can you help me?")
   - [ ] Press Enter
   - [ ] Your message appears in blue bubble on right
   - [ ] AI response starts streaming
   - [ ] Response text appears character by character
   - [ ] Response completes with assistant avatar

3. Multi-line Input:
   - [ ] Type message with Shift+Enter for new line
   - [ ] Text area expands
   - [ ] Enter still sends message

4. Chat List:
   - [ ] Chat appears in sidebar
   - [ ] Shows first ~50 chars of first message as title
   - [ ] Displays timestamp
   - [ ] Hover shows delete button

5. Multiple Chats:
   - [ ] Create second chat
   - [ ] Both chats appear in sidebar
   - [ ] Can switch between chats
   - [ ] Messages persist per chat

### Step 5: Code Functionality

1. Request Code:
   - [ ] Ask AI: "Write a Python function to calculate fibonacci"
   - [ ] Code appears in message with syntax highlighting
   - [ ] Code also appears in Canvas panel on right
   - [ ] Copy button appears on code block

2. Canvas Panel:
   - [ ] Code snippet shows in Canvas
   - [ ] Language label displays correctly
   - [ ] Copy button works (click and verify "✓" appears)
   - [ ] Multiple code blocks accumulate

### Step 6: Voice Input

1. Enable Voice:
   - [ ] Click microphone icon
   - [ ] Icon changes to "mic off" and pulses red
   - [ ] Browser requests microphone permission (grant it)
   - [ ] "Recording..." message appears

2. Record:
   - [ ] Speak a message clearly
   - [ ] Click mic icon again to stop
   - [ ] "Processing..." appears
   - [ ] Transcribed text appears in input box
   - [ ] Can edit transcription before sending
   - [ ] Press Enter to send

### Step 7: Window Management

1. Always on Top:
   - [ ] Enable in Settings
   - [ ] Window stays above other windows
   - [ ] Disable returns to normal behavior

2. Opacity:
   - [ ] Adjust slider in Settings
   - [ ] Window becomes semi-transparent
   - [ ] Set back to 100% for solid window

3. Screen Protection:
   - [ ] Enable in Settings
   - [ ] (Feature is enabled, actual hiding requires screen sharing)

### Step 8: Data Persistence

1. Close and Reopen:
   - [ ] Close app (Cmd+Q or red button)
   - [ ] Run `npm run dev` again
   - [ ] All chats still present
   - [ ] Settings preserved
   - [ ] Can open previous chats

2. Delete Chat:
   - [ ] Hover over chat in sidebar
   - [ ] Click trash icon
   - [ ] Confirm deletion
   - [ ] Chat removed from list

### Step 9: Error Handling

1. No API Key:
   - [ ] Clear API key in settings
   - [ ] Try to send message
   - [ ] Appropriate error message appears

2. Invalid API Key:
   - [ ] Enter invalid key (e.g., "sk-invalid123")
   - [ ] Click Test
   - [ ] "API key is invalid" message appears

3. Network Error:
   - [ ] Turn off WiFi
   - [ ] Try to send message
   - [ ] Error message displays gracefully

## Performance Checks

- [ ] App loads in < 5 seconds
- [ ] Messages stream smoothly
- [ ] No visible lag when typing
- [ ] Window resize is smooth
- [ ] Chat list scrolls smoothly with many chats
- [ ] No console errors in DevTools

## UI/UX Checks

- [ ] Layout is clean and organized
- [ ] Text is readable
- [ ] Buttons have hover states
- [ ] Interactive elements are obvious
- [ ] Colors are consistent
- [ ] Spacing looks balanced
- [ ] Icons are clear
- [ ] Loading states are visible
- [ ] Empty states are helpful

## Cross-Check Documentation

- [ ] README.md explains all features
- [ ] QUICK_START.md has simple instructions
- [ ] PROJECT_SUMMARY.md lists all components
- [ ] All files mentioned in docs exist

## Production Build (Optional)

```bash
npm run build
```

- [ ] Build completes without errors
- [ ] `dist/` directory created
- [ ] Can test built app

## Known Issues to Verify

1. Electron Module Import:
   - If you see "Cannot read properties of undefined", it's because Electron APIs are only available when running inside Electron, not in plain Node.js
   - Solution: Always run via `npm run dev`, not `node electron/main.js`

2. Port Already in Use:
   - If Vite says port 5173 is in use, it will automatically try 5174
   - This is normal if you have multiple Vite projects

3. Microphone Permission:
   - First time using voice, macOS will ask for permission
   - If denied, voice won't work - re-enable in System Preferences

## Success Criteria

The project is complete and working if:
- ✅ All sections above pass
- ✅ Can create chats and get AI responses
- ✅ Can use both text and voice input
- ✅ Settings save and persist
- ✅ Window controls work
- ✅ Code displays correctly
- ✅ No critical errors in console

## Next Steps After Verification

1. **Customize**:
   - Add your own branding
   - Adjust colors in tailwind.config.js
   - Modify default settings

2. **Deploy**:
   - Run `npm run build`
   - Distribute DMG to users
   - Set up auto-updates (optional)

3. **Extend**:
   - Add new features from Future Enhancements list
   - Integrate additional OpenAI features
   - Add analytics (optional)

---

**Status Check Date:** _________________
**Verified By:** _________________
**All Tests Passing:** YES / NO
**Notes:** _________________
