# Real-Time AI Meeting Assistant - Technical Requirements Document

## 📋 Project Overview

### What is This Application?
A desktop application for macOS that provides real-time AI assistance during meetings, interviews, and professional conversations. The app captures questions via voice or text input and displays AI-generated answers instantly through an elegant, privacy-focused interface similar to ChatGPT or Claude desktop applications.

### Primary Use Case
During live meetings or interviews, when someone asks you a question you don't know the answer to, this app listens to the question (via microphone or system audio), sends it to OpenAI's AI, and displays the answer as text on your screen in real-time. You can then read the answer and respond naturally without anyone knowing you're getting AI assistance.

### Core Value Proposition
- Get instant AI help during live conversations
- Works with any meeting platform (Zoom, Google Meet, Teams, etc.)
- Privacy-focused with screen share protection
- Dual input methods: voice and text
- Professional ChatGPT-like interface
- All data stored locally for security

---

## 🎯 Key Features & Requirements

### 1. Dual Input System

#### Text Input Mode
**Description:** Users can type questions or messages directly into a text box, similar to ChatGPT or Claude web interfaces.

**Requirements:**
- Multi-line text input area at the bottom of the interface
- Support for Enter key to send message
- Support for Shift+Enter to create new line without sending
- Real-time character counting (optional)
- Placeholder text guidance
- Auto-focus on input area when app opens
- Input validation to prevent empty messages
- Support for pasting formatted text
- Optional: Markdown support in input

**User Flow:**
1. User clicks into text input area
2. Types their question or message
3. Presses Enter key or clicks Send button
4. Message appears on right side of chat (user message)
5. AI processes and responds on left side (AI message)
6. Response streams in character-by-character for smooth UX

**API Used:** OpenAI Chat Completion API (REST endpoint)

**Model Options:** GPT-4 Turbo, GPT-4, GPT-3.5 Turbo, or any compatible text model

**Benefits:**
- Faster for quick questions
- More cost-effective than voice
- Allows editing before sending
- Better for complex queries requiring specific wording
- Works without audio permissions

#### Voice Input Mode
**Description:** Users can record their voice (or meeting audio) which gets transcribed and processed by AI in real-time.

**Requirements:**
- Microphone icon button in input area
- Visual feedback when recording (waveform animation, pulsing icon, or recording indicator)
- Recording duration timer display
- Real-time audio level visualization
- Audio quality indicator
- Recording controls: Stop, Cancel, Send, Restart
- Audio format: WebM or compatible format for streaming
- Support for audio encoding (Opus codec recommended)
- Automatic silence detection (optional advanced feature)
- Audio buffer management to prevent memory issues

**Recording Controls:**
- **Mute Button:** Temporarily pause audio capture without stopping recording
- **Stop Button:** End recording and prepare for sending
- **Cancel Button:** Discard recording and return to normal input
- **Send Button:** Process and send the recorded audio to AI
- **Restart Button:** Clear current recording and start fresh

**User Flow:**
1. User clicks microphone icon
2. Interface switches to recording mode
3. Audio waveform appears showing sound levels
4. Timer shows recording duration
5. User can mute, stop, cancel, or restart as needed
6. When ready, user clicks Send
7. Audio is processed by OpenAI Realtime API
8. AI response appears as text (streaming)
9. Interface returns to normal mode

**API Used:** OpenAI Realtime API (WebSocket connection)

**Model Options:** gpt-4o-realtime-preview or compatible real-time models

**Audio Sources (Toggleable):**
- **Option A - Physical Microphone:** Captures audio directly from Mac's built-in or external microphone. Picks up user's voice and any audio playing through speakers.
- **Option B - BlackHole Virtual Audio:** Captures system audio directly from meeting applications without echo or feedback issues. Requires BlackHole driver installation.

**Benefits:**
- Natural conversation flow during meetings
- Hands-free operation
- Captures exact wording from interviewer/meeting participant
- Better for complex questions that are hard to type quickly
- More discreet during live conversations

---

### 2. User Interface Layout (Three-Panel Design)

#### Panel 1: Left Sidebar (Chat History & Navigation)

**Purpose:** Display organized chat history and provide navigation between conversations.

**Components Required:**
- Header section with "New Chat" button
- Collapsible sidebar (hide/show toggle)
- Scrollable chat list
- Date-based grouping sections
- Search/filter functionality
- Settings button at bottom
- User profile section

**Chat Organization Structure:**
- **Today:** All chats from current day
- **Yesterday:** All chats from previous day
- **Last 7 Days:** Chats from past week
- **Last 30 Days:** Chats from past month
- **Older:** Archive of older conversations

**Chat List Item Requirements:**
- Chat title (auto-generated from first message or user-defined)
- Timestamp of last message
- Preview snippet of last message (optional)
- Message count indicator (optional)
- Unread indicator if applicable
- Hover effects for interactivity
- Context menu for actions (rename, delete, pin, export)
- Drag-and-drop for organization (optional advanced feature)

**Sidebar Features:**
- Collapse/expand animation
- Keyboard shortcuts for navigation (Cmd+N for new chat, Cmd+K for search)
- Pin important chats to top
- Delete confirmation dialog
- Rename chat functionality
- Export chat as markdown, PDF, or JSON
- Responsive width (fixed or resizable)

**Search Functionality:**
- Full-text search across all messages
- Filter by date range
- Filter by input type (text/voice)
- Filter by model used
- Search results highlighting
- Real-time search suggestions

#### Panel 2: Main Chat Interface (Center Panel)

**Purpose:** Primary conversation area where messages are displayed and input is handled.

**Layout Sections:**

**Top Bar:**
- Current chat title (editable)
- Chat metadata (model used, message count, tokens used)
- Action buttons (share, export, clear conversation)
- Settings quick access
- Close/minimize/maximize window controls

**Message Display Area:**
- Scrollable container for messages
- Auto-scroll to bottom on new messages
- Manual scroll support with "scroll to bottom" button
- Infinite scroll for loading older messages
- Loading indicators for historical messages
- Empty state for new chats

**Message Alignment & Styling:**
- **AI Messages (Left Side):**
  - AI avatar/icon on left
  - Message bubble with background
  - Timestamp below message
  - Model name indicator
  - Message actions (copy, regenerate, rate)
  - Code blocks with syntax highlighting
  - Markdown rendering support
  - "View in Canvas" button for code content

- **User Messages (Right Side):**
  - User avatar/icon on right
  - Message bubble with different background color
  - Timestamp below message
  - Input type indicator (text/voice icon)
  - Message actions (edit, delete, copy)
  - Markdown rendering support

**Message Features:**
- Copy message content button
- Regenerate response button (for AI messages)
- Edit message button (for user messages)
- Delete message button
- Rate response (thumbs up/down for AI messages)
- Share individual message
- Context menu for additional actions

**Bottom Input Area:**
- Text input box (expandable based on content)
- Microphone button for voice input
- Model selector dropdown
- Send button
- Attach file button (optional future feature)
- Emoji picker (optional)
- Character/token counter (optional)
- Input suggestions based on chat context (optional advanced feature)

**Real-Time Features:**
- Typing indicator when AI is generating
- Streaming text display (character-by-character)
- Stop generation button during AI response
- Connection status indicator
- Error messages inline with retry options

#### Panel 3: Canvas/Artifact Panel (Right Side - Conditional)

**Purpose:** Display code, visualizations, or rich content in a separate, focused panel.

**Trigger Conditions:**
- Automatically appears when AI responds with code blocks
- User clicks "View in Canvas" button
- User manually opens canvas from menu
- Persists across messages in same chat session

**Canvas Features:**
- Resizable width (drag handle on left edge)
- Close button to hide canvas
- Multiple tabs for different artifacts in same chat
- Tab switching between artifacts
- Full-screen mode for canvas content

**Content Types Supported:**
- **HTML/CSS/JavaScript:** Live rendered preview with iframe isolation
- **React Components:** Live component rendering with hot reload
- **Code Display:** Syntax-highlighted code with line numbers
- **Mermaid Diagrams:** Flowcharts, sequence diagrams, etc.
- **SVG Graphics:** Vector graphics display
- **Markdown:** Rendered markdown content
- **JSON/XML:** Formatted and collapsible structure view

**Canvas Controls:**
- Copy code button
- Download as file button
- Edit code button (opens in editor mode)
- Refresh preview button
- View source toggle (preview vs code)
- Theme switcher (light/dark for code)
- Font size controls
- Line wrapping toggle

**Live Preview Features:**
- Real-time rendering as code updates
- Error console display
- Responsive preview (mobile/tablet/desktop views)
- Zoom controls
- DevTools integration (optional advanced feature)

**Editor Mode (Optional Advanced Feature):**
- Inline code editing with syntax highlighting
- Auto-completion
- Error detection and linting
- Format code button
- Save changes back to chat
- Version history

---

### 3. Model Selection & Configuration

#### Per-Message Model Selection

**Location:** Dropdown menu in bottom input area, next to send button

**Requirements:**
- Visible model indicator showing current selection
- Quick-access dropdown for model switching
- No need to open settings for model change
- Model selection persists per chat session
- Different chats can use different models
- Model history for recently used models

**Available Models (Text Mode):**
- GPT-4 Turbo (default recommended)
- GPT-4 (standard)
- GPT-3.5 Turbo (fast and economical)
- Custom API-compatible models (advanced users)

**Model Display Information:**
- Model name
- Cost indicator (tokens per dollar)
- Speed indicator (fast/medium/slow)
- Capability tags (best for coding, creative, analysis)
- Context window size

**Model Selection UX:**
- Keyboard shortcuts (Cmd+1, Cmd+2, etc.)
- Recently used models at top
- Favorites/pinned models
- Model comparison tooltip on hover
- Cost estimate before sending (optional)

#### Global Model Settings

**Location:** Settings panel

**Text Model Configuration:**
- Default text model selection
- Temperature slider (0.0 to 2.0)
- Max tokens limit
- Top-p (nucleus sampling) slider
- Frequency penalty slider
- Presence penalty slider
- System prompt customization (advanced)
- Stop sequences configuration (advanced)

**Voice Model Configuration:**
- Voice model selection (gpt-4o-realtime-preview)
- Audio quality settings (low/medium/high)
- Voice activity detection sensitivity
- Silence threshold for auto-send (optional)
- Audio encoding format selection
- Sample rate configuration

**Model Performance Settings:**
- Streaming vs batch response preference
- Response timeout duration
- Retry attempts on failure
- Fallback model if primary fails
- Rate limiting configuration

---

### 4. Chat History & Session Management

#### Data Storage Requirements

**Storage Technology:** IndexedDB (browser-based database for local storage)

**Storage Structure:**
- Separate database for each user profile (if multi-user support)
- Table for chat sessions
- Table for messages
- Table for settings/preferences
- Table for user data/cache

**What Gets Stored:**
- Complete message history (user and AI messages)
- Message metadata (timestamp, model used, token count, input type)
- Chat session metadata (title, creation date, last updated, tags)
- User preferences and settings
- Model usage statistics
- Cached responses for common queries (optional)

**Storage Limits:**
- No hard limit (IndexedDB supports large storage)
- User notification when storage exceeds certain threshold
- Option to export and clear old chats
- Automatic cleanup of very old chats (with user permission)

#### Session Management Features

**Chat Session Operations:**
- Create new chat session
- Open existing chat session
- Rename chat session
- Delete chat session (with confirmation)
- Duplicate chat session
- Merge chat sessions (advanced feature)
- Archive old chats
- Pin important chats
- Tag chats for organization

**Auto-Save Functionality:**
- Save after every message exchange
- Auto-save draft messages
- Background save without UI blocking
- Conflict resolution if multiple instances open (rare case)
- Save state before app closes

**Session Continuity:**
- Resume last active chat on app restart
- Preserve scroll position in chat
- Restore input draft if app crashed
- Remember model selection per session
- Maintain canvas state across sessions

**Export & Backup:**
- Export individual chat as markdown
- Export chat as PDF with formatting
- Export as JSON for data portability
- Bulk export all chats
- Scheduled auto-backup to user-specified location
- Backup encryption for security
- Import chats from export files

**History Search & Filter:**
- Full-text search across all messages
- Filter by date range
- Filter by model used
- Filter by input type (text/voice)
- Filter by message length
- Filter by tags or keywords
- Sort by relevance, date, or token usage

#### Session Analytics (Optional Advanced Feature)
- Total messages sent/received
- Total tokens used per session
- Average response time
- Most used models
- Cost tracking per session
- Time spent in app per session
- Export analytics as CSV/JSON

---

### 5. Audio System Architecture

#### Audio Input Sources

**Source 1: Physical Microphone**

**Description:** Captures audio directly from Mac's built-in microphone or external USB/Bluetooth microphones.

**Requirements:**
- Request microphone permission from macOS on first use
- Display permission status in settings
- List all available audio input devices
- Allow user to select preferred device
- Show audio level meter when device is active
- Handle device disconnection gracefully
- Automatic device switching if primary device fails

**Use Cases:**
- Solo practice or preparation
- Recording your own questions
- Capturing audio when meeting is on speaker
- Testing and debugging audio setup

**Limitations:**
- May pick up echo from speakers
- Background noise interference
- Cannot capture remote participant audio directly
- Requires quiet environment for best results

**Source 2: BlackHole Virtual Audio Device**

**Description:** BlackHole is a free macOS audio driver that creates a virtual audio routing system, allowing this app to capture system audio directly from meeting applications.

**What is BlackHole:**
- Free, open-source virtual audio driver for macOS
- Creates virtual audio input/output devices
- Allows audio routing between applications
- Zero latency audio pass-through
- Supports multi-channel audio

**User Installation Process:**
1. User downloads BlackHole from official website
2. Installs .pkg installer
3. Creates "Multi-Output Device" in macOS Audio MIDI Setup
4. Combines BlackHole output + headphone output in Multi-Output
5. Sets meeting app to use Multi-Output device
6. Sets this app to use BlackHole as input
7. Result: Meeting audio flows to both headphones and this app

**App Integration Requirements:**
- Detect if BlackHole is installed
- Show installation guide if not detected
- List BlackHole device in audio input selector
- Validate BlackHole configuration
- Show visual indicator when BlackHole is active
- Monitor audio signal from BlackHole
- Provide troubleshooting tips for common issues

**Audio Flow Diagram (Conceptual):**
```
Meeting App (Zoom/Meet)
    ↓ (audio output set to Multi-Output Device)
Multi-Output Device
    ↓                    ↓
BlackHole          Headphones
    ↓                    ↓
This App         User Hears
(captures)       (listens)
```

**Benefits of BlackHole:**
- Captures clean audio from remote participants
- No echo or feedback issues
- No background noise from room
- Professional audio quality
- Works with all meeting platforms
- User still hears meeting audio normally

**Settings Panel Integration:**
- Toggle between Microphone and BlackHole
- Visual guide for BlackHole setup
- Test audio button to verify input
- Audio level meter for monitoring
- Latency measurement and display
- Quality indicator (bit rate, sample rate)

#### Audio Processing Pipeline

**Step 1: Audio Capture**
- Use Web Audio API's getUserMedia() to access audio input
- Create MediaStream from selected device
- Handle permission denied gracefully with user-friendly message

**Step 2: Audio Monitoring**
- Real-time audio level visualization (waveform or meter)
- Peak level detection
- Clipping detection and warning
- Silence detection for auto-pause (optional)
- Background noise gate (optional advanced feature)

**Step 3: Audio Recording**
- Use MediaRecorder API for audio capture
- Record in WebM container with Opus codec (recommended)
- Chunk audio data for streaming (timeslice parameter)
- Store chunks in memory buffer
- Monitor buffer size to prevent memory overflow

**Step 4: Audio Encoding**
- Encode audio as Base64 for transmission
- Compress audio if needed for bandwidth
- Support multiple codecs (Opus, PCM)
- Adaptive bitrate based on connection quality
- Error correction for lossy connections

**Step 5: Transmission**
- Send audio chunks via WebSocket to OpenAI Realtime API
- Handle connection drops and reconnections
- Queue audio data if connection is slow
- Implement backpressure handling
- Monitor transmission latency

**Step 6: Response Handling**
- Receive streaming text response from API
- Parse and display in real-time
- Handle partial responses gracefully
- Cancel streaming if user requests
- Error recovery for incomplete responses

#### Audio Quality Settings

**Quality Presets:**
- **Low Quality:** 16 kHz, 64 kbps (for slow connections)
- **Medium Quality:** 24 kHz, 96 kbps (balanced, default)
- **High Quality:** 48 kHz, 128 kbps (best quality, more bandwidth)

**Advanced Settings:**
- Sample rate selection
- Bit rate configuration
- Mono vs stereo recording
- Noise suppression toggle
- Echo cancellation toggle
- Automatic gain control
- Audio buffer size

**Network Diagnostics:**
- Connection latency display (milliseconds)
- Packet loss indicator
- Bandwidth usage monitor
- WebSocket connection status
- Reconnection attempts counter
- Error log for troubleshooting

---

### 6. Screen Share Protection (Privacy Feature)

#### What is Screen Share Protection?

**Description:** A privacy feature that makes the app window invisible to screen recording software and screen sharing applications. When enabled, other people viewing your shared screen cannot see this app window, but you can still see it on your local display.

**Why This Matters:**
During interviews or presentations when screen sharing:
- Interviewer/audience cannot see the AI assistant
- You can read AI answers privately
- Maintains professional appearance
- Prevents awkward explanations
- Complies with interview integrity policies
- Useful for confidential work scenarios

**Technical Implementation:**
Uses Electron's built-in `setContentProtection()` method which leverages macOS's window server privacy features to exclude the window from screen capture APIs.

#### How It Works

**macOS Level Protection:**
- macOS window server marks window as "protected"
- Screen capture APIs exclude protected windows
- Works with native macOS screen recording
- Works with all major meeting platforms
- Works with QuickTime screen recording
- Works with third-party screen capture tools

**Limitations:**
- Does not protect against physical camera pointed at screen
- Does not protect against screenshots on another device
- Only works on macOS (this app is macOS-only)
- Some advanced screen capture tools may bypass (rare)

#### User Controls

**Settings Configuration:**
- Toggle switch to enable/disable protection
- Default state: OFF (user must explicitly enable)
- Status indicator in main UI when active
- Keyboard shortcut to quickly toggle (Cmd+Shift+P)
- Warning message explaining what it does
- Legal disclaimer about appropriate use

**Visual Indicators:**
- Icon in title bar when protection is active
- Color change in window border (subtle)
- Toast notification when toggling state
- Settings panel shows current status
- Tooltip reminder on hover

**User Experience:**
- One-click toggle in settings
- Keyboard shortcut for quick access
- Remember preference across sessions
- Quick access from system tray (optional)
- Notification before joining meeting (optional reminder)

#### Testing & Validation

**How Users Can Test:**
- Open app with protection enabled
- Start screen sharing in Zoom/Meet
- Open another window to verify screen share works
- Confirm this app is not visible in shared screen
- Disable protection and verify app becomes visible
- Test with QuickTime screen recording

**Troubleshooting:**
- Help documentation with screenshots
- Common issues FAQ
- Test mode that shows protection status
- Validate protection is actually working
- Report if protection fails (bug report)

#### Ethical Considerations

**Responsible Use Messaging:**
- Clear disclaimer in app about appropriate use
- Reminder that hiding from screen share may violate policies
- User responsibility for following rules/laws
- Not intended for cheating or deception
- Designed for personal productivity and privacy

**Legal Compliance:**
- User agreement acknowledging appropriate use
- Terms of service outlining acceptable scenarios
- No liability for misuse of protection feature
- Comply with educational and professional standards
- Option to completely disable feature if desired

---

### 7. Window Management & Behavior

#### Window Modes

**Mode 1: Normal Desktop Window**

**Characteristics:**
- Standard macOS application window
- Appears in dock
- Appears in Mission Control/Exposé
- Can be minimized to dock
- Can be hidden (Cmd+H)
- Follows normal window focus rules
- Can be moved behind other windows

**Window Controls:**
- Native macOS traffic light buttons (red, yellow, green)
- Red button: Close window (with quit confirmation)
- Yellow button: Minimize to dock
- Green button: Full screen mode or zoom
- Double-click title bar to minimize (macOS default behavior)

**Sizing:**
- Default size: 30% of screen dimensions
- Minimum size: 800x600 pixels (prevents unusably small)
- Maximum size: Full screen or 90% of screen
- Remember last size on reopen
- Remember last position on screen
- Snap to screen edges (optional)

**Mode 2: Always-on-Top Overlay**

**Characteristics:**
- Floats above all other windows
- Cannot be hidden by other apps
- Still appears in dock
- Persists across desktop spaces
- Stays visible during meetings
- Can be moved but always on top

**Use Cases:**
- Active monitoring during meetings
- Quick reference while working in other apps
- Screen share scenarios (with protection enabled)
- Multi-monitor setups
- Presentation assistance

**Toggle Mechanism:**
- Checkbox in settings "Always on Top"
- Keyboard shortcut (Cmd+Shift+T)
- System tray quick toggle
- Visual indicator when mode is active
- Remember preference per session or globally

#### Window Appearance

**Glass Morphism Design:**
- Translucent/blurred background effect
- Frosted glass appearance
- Subtle shadows and borders
- Modern, clean aesthetic
- Matches macOS Big Sur+ design language

**Opacity Control:**
- Slider in settings (0% to 100%)
- 0%: Fully transparent (text still visible)
- 50%: Semi-transparent (default)
- 100%: Fully opaque
- Live preview while adjusting
- Different opacity for active vs inactive window (optional)
- Remember opacity preference

**Theme Support:**
- Light theme (light background)
- Dark theme (dark background)
- Auto theme (follows macOS system preference)
- Custom theme colors (advanced)
- High contrast mode for accessibility
- Colorblind-friendly options

**Animations:**
- Smooth window opening/closing
- Fade in/out transitions
- Message slide-in animations
- Button hover effects
- Smooth scrolling
- Reduced motion option for accessibility

#### Window Positioning

**Draggable Area:**
- Custom title bar as drag handle
- Entire top bar is draggable
- Click and drag to reposition
- Snap to screen edges (magnetic effect)
- Prevent window from going off-screen
- Multi-monitor support (move between displays)

**Position Memory:**
- Remember last position on screen
- Remember position per display
- Restore to saved position on reopen
- Reset to default position option
- Keyboard shortcuts for positioning (center, corners)

**Multi-Monitor Support:**
- Detect all connected displays
- Choose which display to open on
- Move window between displays
- Remember preferred display
- Handle display disconnection gracefully
- Scale UI appropriately for different resolutions

#### Keyboard Shortcuts

**Essential Shortcuts:**
- Cmd+N: New chat
- Cmd+W: Close current chat
- Cmd+Q: Quit application
- Cmd+,: Open settings
- Cmd+K: Focus search
- Cmd+/: Show keyboard shortcuts help
- Cmd+Shift+T: Toggle always-on-top
- Cmd+Shift+P: Toggle screen protection
- Cmd+Enter: Send message
- Cmd+1/2/3: Switch models
- Cmd+R: Regenerate last response
- Cmd+L: Clear chat
- Cmd+F: Find in chat

**Customizable Shortcuts:**
- User can reassign shortcuts in settings
- Conflict detection for duplicate assignments
- Reset to defaults option
- Export/import shortcut configurations
- Global shortcuts (work when app not focused)

---

### 8. Settings & Configuration

#### Settings Panel Layout

**Access Methods:**
- Click settings icon in sidebar
- Keyboard shortcut (Cmd+,)
- Menu bar item (if menu bar implemented)
- System tray icon (optional)

**Panel Organization:**
Tabbed or sectioned interface with categories:

#### Section 1: Account & API

**OpenAI API Key Configuration:**
- Single text input for API key
- Password-style masking (bullets/asterisks)
- Show/hide toggle for viewing key
- Validate key by testing API connection
- Key status indicator (valid/invalid/not set)
- Instructions link for obtaining API key
- Secure storage using macOS Keychain
- Option to clear/remove key
- Test connection button

**API Usage Statistics (Optional):**
- Total tokens used today/this week/this month
- Estimated cost based on usage
- Usage breakdown by model
- Usage graphs and trends
- Export usage data as CSV
- Set usage limits and alerts

**Account Information (Future Feature):**
- User profile name and avatar
- Multi-account support (switch between API keys)
- Sync settings across devices (via iCloud)

#### Section 2: Appearance

**Theme Settings:**
- Theme selector: Light / Dark / Auto
- Accent color picker
- Font family selection
- Font size adjustment (small/medium/large)
- UI density (compact/comfortable/spacious)
- Custom CSS option (advanced users)

**Window Opacity:**
- Slider control (0-100%)
- Live preview of changes
- Separate opacity for active/inactive state
- Apply to entire window or just background
- Preset buttons (25%, 50%, 75%, 100%)

**Window Behavior:**
- Always on top toggle
- Start in full screen toggle
- Default window size dropdown
- Remember window position toggle
- Snap to edges toggle

**Accessibility:**
- High contrast mode
- Increased text size
- Reduce animations toggle
- Screen reader optimization
- Colorblind-friendly themes
- Keyboard navigation enhancements

#### Section 3: Audio Settings

**Input Device Selection:**
- Dropdown list of available audio devices
- Microphone/BlackHole toggle switch
- Audio level test meter
- Test recording button
- Device refresh button if not detected

**Audio Quality:**
- Quality preset: Low / Medium / High
- Sample rate selection (16/24/48 kHz)
- Bit rate selection
- Mono/stereo toggle
- Audio format selection

**Advanced Audio:**
- Noise suppression toggle
- Echo cancellation toggle
- Automatic gain control toggle
- Voice activity detection sensitivity
- Buffer size configuration
- Latency optimization mode

**BlackHole Configuration:**
- Installation status indicator
- Setup guide/tutorial button
- Troubleshooting tips
- Audio routing diagram
- Verify configuration button
- Quick setup wizard (step-by-step)

**Network & Performance:**
- Connection latency display
- WebSocket status indicator
- Packet loss percentage
- Bandwidth usage monitor
- Connection quality indicator
- Automatic reconnection toggle
- Offline mode behavior

#### Section 4: Models & AI

**Text Model Configuration:**
- Default model selector dropdown
- Temperature slider with explanation
- Max tokens input field
- Top-p (nucleus sampling) slider
- Frequency penalty slider
- Presence penalty slider
- Best of (n) selection
- Stop sequences input

**Voice Model Configuration:**
- Voice model selector
- Voice processing mode
- Real-time optimization toggle
- Voice quality settings
- Transcription accuracy mode

**Model Presets:**
- Save custom configurations as presets
- Quick switch between presets
- Preset naming and organization
- Import/export presets
- Reset to defaults button

**Response Behavior:**
- Stream responses toggle
- Response timeout duration
- Auto-regenerate on error toggle
- Show thinking process toggle (if model supports)
- Citation style preference

#### Section 5: Privacy & Security

**Screen Share Protection:**
- Enable/disable toggle
- Explanation of how it works
- Test protection button
- Keyboard shortcut assignment
- Warning message about responsible use
- Legal disclaimer

**Data Storage:**
- Show storage location
- Current storage size used
- Clear all data button (with confirmation)
- Export all data button
- Auto-cleanup old chats toggle
- Retention period selection (30/60/90 days or forever)

**Encryption:**
- API key encryption status
- Local database encryption toggle
- Encryption strength indicator
- Backup encryption toggle

**Permissions:**
- Microphone permission status
- Screen recording permission status (for BlackHole)
- Request permissions buttons
- Permission troubleshooting guide

**Privacy Options:**
- Anonymous usage statistics toggle
- Crash report sharing toggle
- Don't save sensitive conversations toggle
- Auto-delete after session toggle

#### Section 6: Keyboard Shortcuts

**Shortcut Customization:**
- List of all available shortcuts
- Click to edit functionality
- Conflict detection
- Reset to defaults button
- Export/import shortcuts
- Search shortcuts by action
- Grouped by category

**Global Shortcuts:**
- Show/hide app (works when app not focused)
- Quick capture (start voice recording from anywhere)
- New chat from anywhere
- Enable/disable toggle for global shortcuts

#### Section 7: Advanced

**Developer Options:**
- Show API request/response logs
- Debug mode toggle
- Verbose logging toggle
- Export logs button
- Clear cache button
- Reset app to defaults (nuclear option)

**Experimental Features:**
- Enable beta features toggle
- Feature flags for testing
- Opt-in to alpha releases

**Performance:**
- Hardware acceleration toggle
- Memory limit configuration
- Cache size limit
- Background processing toggle

**Updates:**
- Auto-update toggle
- Check for updates button
- Update channel (stable/beta)
- Release notes viewer

#### Section 8: About

**App Information:**
- App version number
- Build date
- Electron version
- License information
- Credits and acknowledgments
- Third-party licenses

**Support & Feedback:**
- Help documentation link
- FAQ link
- Report bug button
- Feature request form
- Contact support
- Community forum link

**Legal:**
- Terms of service
- Privacy policy
- Open source licenses
- Responsible use guidelines

---

### 9. API Integration Details

#### OpenAI Chat Completion API (Text Mode)

**API Endpoint:** `https://api.openai.com/v1/chat/completions`

**Request Method:** POST

**Authentication:** Bearer token in Authorization header using user's API key

**Request Structure:**
Must send a JSON payload containing:
- Model identifier (e.g., "gpt-4-turbo-preview")
- Array of messages (role and content pairs)
- Optional parameters (temperature, max_tokens, etc.)
- Stream flag (true for streaming responses)

**Response Handling:**

**Non-Streaming Response:**
- Returns complete response in single JSON object
- Extract text from response.choices[0].message.content
- Display entire response at once
- Simpler implementation but less engaging UX

**Streaming Response (Recommended):**
- Returns Server-Sent Events (SSE) stream
- Each chunk contains a delta of new content
- Parse each chunk as it arrives
- Append to UI character by character
- More engaging user experience
- Allows "stop generation" functionality
- Must handle stream termination properly

**Error Handling:**
- Rate limit errors (429 status)
- Invalid API key (401 status)
- Model not found (404 status)
- Context length exceeded (400 status)
- Network timeout errors
- Invalid request format errors
- Server errors (500+ status)

**Implementation Requirements:**
- Retry logic with exponential backoff
- User-friendly error messages
- Automatic fallback to different model if available
- Queue requests if rate limited
- Cancel in-flight requests when user switches chats

**Token Management:**
- Track tokens used per request
- Warn user when approaching context limit
- Truncate old messages if needed
- Show token count in UI
- Estimate cost before sending (optional)

#### OpenAI Realtime API (Voice Mode)

**API Endpoint:** WebSocket connection to `wss://api.openai.com/v1/realtime`

**Connection Method:** WebSocket (persistent bidirectional connection)

**Authentication:** Send API key in connection parameters or initial message

**Connection Lifecycle:**

**1. Establishing Connection:**
- Create WebSocket connection
- Send authentication message
- Wait for connection confirmation
- Handle connection failure gracefully
- Show connection status to user

**2. Sending Audio:**
- Stream audio chunks in real-time
- Encode audio as Base64
- Send in appropriate message format
- Include metadata (sample rate, encoding)
- Handle backpressure if sending too fast

**3. Receiving Responses:**
- Listen for incoming messages
- Parse streaming text responses
- Display incrementally in UI
- Handle partial responses
- Detect end of response

**4. Maintaining Connection:**
- Send periodic heartbeat/ping messages
- Monitor connection health
- Detect disconnections
- Auto-reconnect on drop
- Queue messages during reconnection

**5. Closing Connection:**
- Send proper close message
- Wait for confirmation
- Clean up resources
- Handle forced disconnection gracefully

**Message Format:**
Different message types for different actions:
- Audio data messages (audio chunks)
- Control messages (start/stop recording)
- Configuration messages (model settings)
- Response messages (text from AI)
- Status messages (connection health)

**Real-Time Considerations:**
- Minimize latency for responsive experience
- Handle network jitter and packet loss
- Audio buffering to prevent choppy playback
- Optimize audio chunk size for balance
- Monitor WebSocket performance metrics

**Error Recovery:**
- Detect connection drops immediately
- Attempt reconnection automatically
- Preserve user's recording if possible
- Notify user of connection issues
- Offer manual retry option

**Voice Activity Detection (VAD):**
- Detect when user starts speaking
- Detect when user stops speaking
- Optional auto-send after silence period
- Adjustable sensitivity settings
- Visual indicator of voice detection

---

### 10. Canvas/Artifact System

#### Purpose & Functionality

**What is Canvas:**
A dedicated panel for displaying rich, interactive content that would be cluttered or less useful inline in the chat. Think of it like a preview pane or code playground.

**When Canvas Appears:**
- AI responds with code blocks (HTML, CSS, JavaScript, React, etc.)
- AI generates diagrams (Mermaid syntax)
- AI creates SVG graphics
- AI produces formatted data (JSON, XML, tables)
- User explicitly requests "show in canvas"

**Why Canvas is Useful:**
- Separates conversation from output
- Allows full-screen code view
- Enables live previews of code
- Provides better syntax highlighting
- Offers interactive editing capabilities
- Keeps chat clean and readable
- Supports multiple artifacts per chat

#### Canvas Features

**Display Modes:**

**Code View:**
- Syntax highlighted code display
- Line numbers on left
- Copy entire code button
- Download as file button
- Expand to full screen
- Support for 50+ programming languages
- Theme toggle (light/dark code theme)
- Font size controls
- Line wrapping toggle
- Search within code (Cmd+F)

**Preview/Render View:**
- Live rendering of HTML/CSS/JS
- Isolated iframe for security
- Responsive preview (resize to test different widths)
- Mobile/tablet/desktop view toggles
- Refresh preview button
- Console output display for errors
- Zoom controls for preview
- Screenshot preview button

**Split View:**
- Code on left, preview on right
- Adjustable split ratio
- Synchronized scrolling (optional)
- Side-by-side comparison

**Diagram View:**
- Render Mermaid diagrams
- Flowcharts, sequence diagrams, etc.
- Export as PNG/SVG
- Zoom and pan controls
- Dark mode support

**Data View:**
- Formatted JSON with collapsible sections
- XML syntax highlighting
- Table view for structured data
- CSV viewer with sorting
- Search and filter capabilities

#### Canvas Management

**Multiple Artifacts:**
- Tab system for multiple code/previews in one chat
- Tab labels with auto-generated or custom names
- Close individual tabs
- Drag to reorder tabs
- "Open in new window" for tab (advanced)

**Canvas State:**
- Persists across app restarts
- Reopens last viewed artifact
- Remembers tab order
- Saves zoom level and position
- Preserves edited code (if editing enabled)

**Canvas Controls:**

**Top Toolbar:**
- Close canvas button (hide panel)
- View mode selector (code/preview/split)
- Theme toggle
- Font size controls
- Full screen toggle
- More options menu

**Bottom Toolbar:**
- Copy code button
- Download button (save as file)
- Share button (copy link/export)
- Edit button (enable editing mode if supported)

#### Code Execution & Security

**Sandboxing:**
- Run code in isolated iframe with sandbox attributes
- Prevent access to parent window
- Restrict network requests (optional)
- No cookies or localStorage from preview
- Content Security Policy enforcement

**Supported Languages/Frameworks:**

**Web Technologies:**
- HTML5 with live preview
- CSS3 with live preview
- Vanilla JavaScript execution
- React JSX rendering (with babel transform)
- Vue.js components (future feature)
- Svelte components (future feature)

**Code Display Only (No Execution):**
- Python
- Java
- C/C++
- Go
- Rust
- Ruby
- PHP
- Swift
- Kotlin
- TypeScript
- And 40+ more via syntax highlighting library

**Limitations:**
- No server-side code execution (Node.js, Python, etc.)
- No file system access
- No npm package installation (use CDN imports only)
- Limited to client-side JavaScript execution
- No WebGL/GPU-intensive graphics (may be slow)

#### Editing Capabilities (Optional Advanced Feature)

**Basic Editing:**
- Click-to-edit mode
- Syntax-aware editing
- Auto-indentation
- Bracket matching
- Multi-cursor support

**Advanced Editing:**
- Auto-completion (IntelliSense-like)
- Error detection and linting
- Code formatting (Prettier-like)
- Refactoring tools
- Find and replace
- Vim/Emacs keybindings (optional)

**Code Actions:**
- "Update with edited code" button
- Sends edited code back to chat
- AI can then refine based on edits
- Version history of edits
- Undo/redo support

---

### 11. Error Handling & User Feedback

#### API Key Errors

**Missing API Key:**
- Show prominent error in main UI
- Message: "OpenAI API Key not configured"
- "Configure API Key" button prominently displayed
- Disable input area until key is set
- Helpful link to OpenAI API key page
- Instructions for obtaining key

**Invalid API Key:**
- Detect on first API call
- Clear error message: "API Key is invalid"
- Suggestion to check for typos
- "Update API Key" button
- Don't repeatedly fail requests with bad key
- Option to test key before saving

**Expired/Revoked Key:**
- Graceful error handling
- Notify user key no longer works
- Prompt to update key
- Preserve chat history even with bad key
- Allow exporting data before fixing

#### Network Errors

**Connection Issues:**
- Timeout errors: "Request timed out. Please try again."
- DNS errors: "Cannot reach OpenAI servers. Check internet connection."
- No internet: "No internet connection detected."
- Firewall blocks: "Connection blocked. Check firewall settings."

**Error Recovery:**
- Automatic retry with exponential backoff
- Show retry attempts to user (Retry 1/3, 2/3, 3/3)
- Manual retry button
- "Cancel request" option during retries
- Queue requests for when connection returns

**Network Monitoring:**
- Connection status indicator (green/yellow/red dot)
- Latency display in settings
- Bandwidth usage monitor
- Alert if connection quality degrades

#### API Rate Limits

**Rate Limit Detection:**
- Catch 429 status code from API
- Parse retry-after header
- Calculate wait time

**User Notification:**
- Clear message: "Rate limit reached. Try again in X seconds."
- Countdown timer showing when retry is possible
- Explanation of why rate limits exist
- Suggestion to upgrade API plan if frequent

**Automatic Handling:**
- Queue messages until rate limit resets
- Retry automatically after wait period
- Don't lose user's message
- Show "queued" status in UI

#### Content Moderation Errors

**Flagged Content:**
- OpenAI may reject harmful prompts
- Show error: "Content policy violation"
- Explain which part triggered flag (if API provides)
- Suggest rephrasing
- Don't retry automatically (won't succeed)

**User Education:**
- Link to OpenAI usage policies
- Examples of acceptable vs unacceptable prompts
- Help users understand boundaries

#### Context Length Errors

**Token Limit Exceeded:**
- Detect when conversation too long
- Message: "Conversation too long for model. Some history removed."
- Automatically truncate oldest messages
- Keep system prompt and recent context
- Show which messages were removed (optional)
- Option to start new chat with summary

**Proactive Prevention:**
- Token counter in UI
- Warning when approaching limit
- "Start new chat" suggestion
- Auto-summarize old messages (advanced)

#### Audio Errors

**Microphone Permission Denied:**
- Clear error: "Microphone access denied"
- Instructions to enable in System Preferences
- Direct link to System Preferences (if possible)
- Fallback to text mode suggestion

**No Audio Device Detected:**
- "No microphone detected"
- Instructions to connect microphone
- Refresh devices button
- Show when device is plugged in

**BlackHole Not Installed:**
- "BlackHole not detected"
- Installation guide button
- Direct download link
- Fallback to regular microphone

**Recording Failed:**
- "Failed to record audio"
- Check device connection
- Check permissions
- Try different device
- Fall back to text mode

**Audio Too Quiet:**
- "Audio level too low"
- Adjust microphone volume suggestion
- Show audio level meter
- Test recording button

**Audio Too Loud (Clipping):**
- "Audio clipping detected"
- Reduce microphone gain suggestion
- Show peak level warning
- Automatic gain control suggestion

#### General Error Handling

**Unexpected Errors:**
- Catch all unhandled errors
- Generic message: "Something went wrong"
- Error code/ID for support reference
- "Report bug" button
- Automatic error logging for developers

**User Actions on Error:**
- Retry button (always available)
- Cancel operation button
- Report problem button
- View error details (for technical users)
- Copy error info for sharing with support

**Error Persistence:**
- Don't lose user's input on error
- Preserve draft message
- Allow sending again after fixing
- Save error log for troubleshooting

#### Success Feedback

**Positive Confirmations:**
- Toast notifications for successful actions
- Green checkmark for saved settings
- "Copied to clipboard" confirmation
- Subtle animations for completed actions
- Sound effects (optional, toggle in settings)

**Progress Indicators:**
- Loading spinner during API calls
- Progress bar for long operations
- "Generating response..." message
- Animated dots during waiting
- Estimated time remaining (if calculable)

---

### 12. Performance Optimization

#### Application Performance

**Startup Time:**
- Target: Launch in under 2 seconds
- Lazy load non-critical components
- Cache frequently accessed data
- Preload essential assets
- Defer loading of settings/history until needed

**Memory Management:**
- Limit number of messages loaded in view
- Virtual scrolling for long chat histories
- Unload old message components when scrolled away
- Clear canvas iframes when not visible
- Monitor memory usage and warn if excessive
- Periodic garbage collection hints

**Rendering Performance:**
- 60 FPS animations target
- Debounce rapid user inputs
- Throttle scroll events
- Use React.memo for expensive components
- Avoid unnecessary re-renders
- Profile and optimize slow components

**Storage Optimization:**
- Compress old messages
- Index database for fast searches
- Limit cache size
- Periodic cleanup of unused data
- Export and archive very old chats

#### Network Optimization

**API Call Efficiency:**
- Batch requests where possible
- Cache responses for duplicate queries (optional)
- Compress request payloads
- Use streaming to show progress
- Cancel unnecessary requests

**Audio Streaming:**
- Optimize chunk size for low latency
- Adaptive bitrate based on connection
- Buffer audio to prevent gaps
- Minimize WebSocket message overhead
- Efficient encoding format

**Connection Management:**
- Connection pooling for HTTP requests
- Persistent WebSocket connection
- Automatic reconnection on drop
- Monitor connection health
- Fallback to polling if WebSocket fails (rare)

#### UI Responsiveness

**Perceived Performance:**
- Optimistic UI updates (show message immediately)
- Skeleton loaders for loading states
- Smooth transitions between states
- Instant feedback on user actions
- Non-blocking operations

**Background Processing:**
- Use Web Workers for heavy computation
- Offload processing to Electron main process
- Don't block UI thread
- Show progress for long operations
- Allow cancellation of long tasks

---

### 13. Accessibility Features

#### Keyboard Navigation

**Full Keyboard Support:**
- Tab through all interactive elements
- Enter/Space to activate buttons
- Arrow keys for dropdowns/lists
- Escape to close modals/dialogs
- All shortcuts clearly documented

**Focus Management:**
- Visible focus indicators
- Logical tab order
- Focus trapping in modals
- Return focus after closing dialogs
- Skip to main content link

#### Screen Reader Support

**ARIA Labels:**
- All interactive elements labeled
- Form inputs have associated labels
- Buttons have descriptive text
- Icons have alt text or ARIA labels
- Status messages announced

**Semantic HTML:**
- Proper heading hierarchy
- Landmark regions (nav, main, aside)
- Lists for grouped content
- Tables with proper headers
- Form elements with labels

**Screen Reader Announcements:**
- New messages announced
- Error messages announced
- Status changes announced (recording started, etc.)
- Progress updates announced
- Avoid announcement spam

#### Visual Accessibility

**High Contrast Mode:**
- Sufficient color contrast ratios (WCAG AAA)
- Don't rely on color alone for information
- Visible focus indicators
- Clear text on backgrounds
- Pattern/texture in addition to color

**Text Scaling:**
- Support text zoom up to 200%
- Layout adapts to larger text
- No text cutoff or overlap
- Readable fonts chosen

**Animations:**
- Respect reduced motion preference
- Disable non-essential animations if requested
- Provide static alternatives
- No flashing content (seizure risk)

#### Cognitive Accessibility

**Clear Language:**
- Simple, plain language in UI
- Error messages are helpful, not technical
- Instructions are clear and concise
- Avoid jargon where possible

**Consistent Layout:**
- Predictable navigation
- Controls in expected locations
- Consistent design patterns
- Clear visual hierarchy

**User Control:**
- Ability to undo actions
- Confirmation for destructive actions
- Adjustable timeouts
- Pause/stop automated content

---

### 14. Security & Privacy

#### API Key Security

**Storage:**
- Use macOS Keychain for storing API key
- Never store in plain text
- Encrypt key even in memory if possible
- Clear from memory when not in use

**Transmission:**
- HTTPS only for API calls
- No logging of API key
- No including key in error reports
- Validate key format before using

**Access Control:**
- Require app authentication to view key (optional)
- Mask key in UI (show only last 4 characters)
- Clipboard security when copying key

#### Data Privacy

**Local Storage:**
- All chat data stored locally only
- No cloud sync without explicit consent
- Encrypted database (optional advanced feature)
- Secure deletion when requested

**Third-Party Access:**
- Only OpenAI receives your prompts
- No analytics or tracking by default
- Optional anonymous usage statistics (opt-in)
- Clear about what data goes where

**Data Retention:**
- User controls how long to keep history
- Auto-delete options
- Complete data export before deletion
- Secure wipe option (overwrite deleted data)

#### Application Security

**Code Signing:**
- Sign app with Apple Developer certificate
- Users can verify app authenticity
- Prevents tampering
- Notarized by Apple for Gatekeeper

**Sandboxing:**
- Run with minimal permissions needed
- Request permissions explicitly
- Explain why each permission is needed
- Graceful degradation if permission denied

**Updates:**
- Signed update packages
- Verify update authenticity before installing
- Secure update channel (HTTPS)
- Option to review changes before updating

**Vulnerability Management:**
- Keep dependencies updated
- Monitor for security advisories
- Quick patching of vulnerabilities
- Transparent communication about security issues

#### Network Security

**Encrypted Connections:**
- TLS 1.3 for all network requests
- Certificate validation
- No fallback to insecure protocols
- Pin certificates for critical connections (optional advanced)

**Input Validation:**
- Sanitize all user inputs
- Validate API responses
- Prevent injection attacks
- Escape special characters in rendering

---

### 15. Testing & Quality Assurance

#### Testing Requirements

**Unit Testing:**
- Test individual functions and components
- Mock API responses
- Test error handling paths
- Test edge cases
- Aim for 80%+ code coverage

**Integration Testing:**
- Test component interactions
- Test data flow through app
- Test API integration
- Test audio pipeline
- Test storage operations

**End-to-End Testing:**
- Test complete user workflows
- Test text mode flow start to finish
- Test voice mode flow start to finish
- Test settings changes
- Test error recovery

**Manual Testing Scenarios:**
- New user first-time setup
- Daily usage patterns
- Edge cases and unusual inputs
- Performance under load
- Multi-hour usage sessions

#### Quality Checks

**Performance Testing:**
- Measure startup time
- Measure response time
- Test with long conversations
- Test memory usage over time
- Profile for bottlenecks

**Compatibility Testing:**
- Test on different macOS versions (11, 12, 13, 14)
- Test on Intel and Apple Silicon Macs
- Test with different screen sizes
- Test with different audio devices

**Accessibility Audit:**
- Keyboard navigation testing
- Screen reader testing (VoiceOver)
- Color contrast validation
- WCAG compliance check

**Security Audit:**
- Penetration testing (optional)
- Dependency vulnerability scanning
- Code review for security issues
- API key security validation

---

### 16. Deployment & Distribution

#### Build Process

**Application Packaging:**
- Use electron-builder for creating installers
- Create macOS .dmg installer
- Include code signing
- Include app notarization for Gatekeeper
- Create installer background image
- Set up application icons

**Release Types:**
- Stable releases (semantic versioning)
- Beta releases for testing
- Alpha builds for early features
- Development builds for internal testing

**Build Artifacts:**
- Universal binary (Intel + Apple Silicon)
- Separate Intel and ARM builds (optional)
- Installer DMG file
- Zip archive for manual installation

#### Distribution Channels

**Direct Distribution:**
- Host on own website
- Provide direct download link
- Update download page for each release
- Include checksums for verification

**Mac App Store (Future):**
- Requires compliance with App Store guidelines
- Sandbox requirements
- In-app purchase for premium features (if any)
- App review process

**Auto-Update System:**
- Check for updates on launch (optional)
- Notify user of available updates
- Background download of updates
- Install on next restart
- Release notes display

#### Documentation

**User Documentation:**
- Getting started guide
- Feature tutorials
- FAQ section
- Troubleshooting guide
- Video tutorials (optional)
- Keyboard shortcuts reference

**Technical Documentation:**
- API integration guide
- Architecture overview
- Development setup instructions
- Contributing guidelines
- Build instructions

**Legal Documentation:**
- Terms of service
- Privacy policy
- License agreement
- Open source attributions
- Responsible use guidelines

---

### 17. Future Enhancements (Optional Advanced Features)

#### Phase 2 Features

**Multi-Language Support:**
- Internationalization (i18n)
- Support for non-English languages
- RTL language support
- Locale-specific formatting

**Cloud Sync:**
- Optional iCloud sync for settings
- Sync chat history across devices
- Conflict resolution for simultaneous edits
- End-to-end encryption for synced data

**Collaboration Features:**
- Share chat sessions with others
- Real-time collaboration on prompts
- Team workspaces
- Role-based permissions

**Advanced Canvas:**
- Full code editor (Monaco Editor)
- Debugging capabilities
- Package manager integration (npm)
- Git integration
- Deploy to hosting (Vercel, Netlify)

#### Phase 3 Features

**AI Enhancements:**
- Support for other AI providers (Anthropic, Google, Cohere)
- Model comparison mode (A/B testing)
- Ensemble responses (multiple models)
- Custom fine-tuned models

**Productivity Tools:**
- Templates for common prompts
- Prompt library
- Scheduled conversations
- Batch processing of prompts
- API playground mode

**Analytics Dashboard:**
- Usage statistics
- Cost tracking
- Productivity metrics
- Model performance comparison
- Export reports

**Mobile Companion App (iOS):**
- View chat history on iPhone
- Quick capture via Siri shortcuts
- Sync with desktop app
- Simplified interface

---

### 18. Implementation Roadmap

#### Phase 1: MVP (Minimum Viable Product)

**Week 1-2: Foundation**
- Set up Electron + React + TypeScript project
- Create basic window with native controls
- Implement basic UI layout (3-panel design)
- Set up routing between views
- Create settings panel structure

**Week 3-4: Core Features**
- Implement text input mode with OpenAI Chat API
- Create message display with left/right alignment
- Add basic chat history storage (IndexedDB)
- Implement streaming response display
- Add model selector dropdown

**Week 5-6: Voice Integration**
- Integrate Web Audio API for microphone access
- Implement audio recording controls
- Connect to OpenAI Realtime API (WebSocket)
- Add waveform visualization
- Implement audio device selection

**Week 7: Chat Management**
- Build sidebar with chat list
- Implement chat session CRUD operations
- Add search functionality
- Create date-based grouping
- Add export functionality

**Week 8: Polish & Testing**
- Implement error handling throughout
- Add loading states and animations
- Create onboarding flow for new users
- Test on different macOS versions
- Fix bugs and optimize performance

#### Phase 2: Enhanced Features

**Week 9-10: Canvas System**
- Build canvas panel with resizable width
- Implement code syntax highlighting
- Add HTML/CSS/JS live preview
- Create copy/download functionality
- Support multiple artifacts via tabs

**Week 11: Audio Advanced**
- Integrate BlackHole support
- Create audio setup wizard
- Add network diagnostics
- Implement adaptive audio quality
- Add audio level meters

**Week 12: Appearance & Accessibility**
- Implement glass morphism design
- Add opacity controls
- Create theme support (light/dark)
- Implement keyboard shortcuts
- Add screen reader support

#### Phase 3: Privacy & Security

**Week 13: Security Features**
- Implement screen share protection
- Add API key encryption with Keychain
- Create secure storage system
- Add data export/import
- Implement permission management

**Week 14: Final Polish**
- Comprehensive testing
- Performance optimization
- Documentation writing
- Create installer and sign app
- Submit for notarization

#### Post-Launch: Maintenance & Updates

**Ongoing:**
- Bug fixes based on user feedback
- Performance improvements
- New model support as OpenAI releases
- Feature requests from users
- Security updates

---

## 🔧 Technology Stack Summary

### Core Technologies

**Desktop Framework:**
- Electron 28+ (Desktop app container)
- Node.js (Backend runtime)

**Frontend:**
- React 18+ (UI library)
- TypeScript 5+ (Type safety)
- Vite (Build tool and dev server)

**State Management:**
- Zustand (Lightweight state)
- React Context (Theme/settings)

**Styling:**
- Tailwind CSS (Utility-first styling)
- Framer Motion (Animations)
- CSS Modules (Component styles)

**UI Components:**
- Radix UI (Headless accessible components)
- lucide-react (Icons)
- Custom components for specialized needs

### Audio Technologies

**Audio Capture:**
- Web Audio API (Browser audio processing)
- MediaRecorder API (Recording)
- getUserMedia API (Device access)

**Audio Device:**
- BlackHole 2ch (Virtual audio driver - user installs)

**Audio Processing:**
- AudioWorklet (Low-latency processing)
- Web Audio nodes (Gain, filters, analyzers)

### AI Integration

**OpenAI APIs:**
- Chat Completion API (REST endpoint for text)
- Realtime API (WebSocket for voice)

**WebSocket Library:**
- ws or native WebSocket (For Realtime API)

### Data Storage

**Local Storage:**
- IndexedDB via idb (Chat history)
- electron-store (Settings/preferences)
- electron-safeStorage (Encrypted API keys)

**File System:**
- Node.js fs module (Export/import)
- Electron dialog (File picker)

### Canvas/Code Display

**Syntax Highlighting:**
- Prism.js or Shiki (Code highlighting)

**Code Editor (Optional):**
- Monaco Editor (VS Code editor)

**Diagram Rendering:**
- Mermaid.js (Diagrams from text)

**Live Preview:**
- Sandboxed iframe (HTML/CSS/JS execution)

### Security

**Encryption:**
- macOS Keychain (API key storage)
- crypto module (Data encryption)

**Content Security:**
- Content Security Policy
- Sandbox attributes

### Development Tools

**Linting & Formatting:**
- ESLint (Code linting)
- Prettier (Code formatting)

**Testing:**
- Vitest (Unit testing)
- React Testing Library (Component testing)
- Playwright (E2E testing)

**Build & Package:**
- electron-builder (Packaging)
- electron-notarize (Apple notarization)

**Version Control:**
- Git (Source control)

### Utilities

**Date/Time:**
- date-fns or Day.js (Date formatting)

**Validation:**
- Zod (Schema validation)

**Logging:**
- electron-log (Application logging)

### External Dependencies

**Must Install by User:**
- BlackHole audio driver (free download)

**Must Provide by User:**
- OpenAI API key

---

## 📚 Learning Resources for Implementation

### Essential Knowledge Areas

**1. Electron Development:**
- Understanding main process vs renderer process
- IPC (Inter-Process Communication)
- Native API integration (Keychain, notifications)
- Window management
- File system access
- Packaging and distribution

**2. React & TypeScript:**
- Functional components and hooks
- State management with Zustand
- Context API for global state
- Performance optimization techniques
- TypeScript interfaces and types
- Component composition patterns

**3. Web Audio API:**
- getUserMedia for microphone access
- MediaRecorder for recording
- AudioContext and audio nodes
- Real-time audio processing
- Audio visualization techniques

**4. OpenAI API Integration:**
- REST API fundamentals
- WebSocket connections
- Streaming responses (SSE)
- Error handling and retries
- Rate limiting management
- Token counting and management

**5. IndexedDB:**
- Database schema design
- CRUD operations
- Indexing for performance
- Transaction management
- Query optimization

**6. macOS-Specific Development:**
- Permission requests (microphone, screen recording)
- Keychain integration
- Code signing process
- App notarization
- DMG creation

---

## 🎯 Success Criteria

### Must-Have Features for Launch

1. ✅ Text input with OpenAI Chat Completion API working
2. ✅ Voice input with OpenAI Realtime API working
3. ✅ Chat history saving and loading
4. ✅ Basic canvas for code display
5. ✅ Settings panel with API key management
6. ✅ Screen share protection working
7. ✅ Always-on-top window mode
8. ✅ BlackHole audio support
9. ✅ Error handling for common scenarios
10. ✅ Smooth performance (60 FPS, <2s startup)

### Nice-to-Have for Launch

1. Advanced canvas with live preview
2. Multi-language support
3. Cloud sync
4. Advanced audio processing
5. Analytics dashboard

### Post-Launch Improvements

1. User feedback integration
2. Performance optimizations
3. Additional AI provider support
4. Mobile companion app
5. Team collaboration features

---

## 🚨 Important Considerations

### Legal & Ethical

**Responsible Use:**
- This app should be used ethically and legally
- Users are responsible for compliance with interview policies
- Academic integrity must be respected
- Professional standards must be upheld
- Screen share protection should not be used to deceive

**Disclaimers:**
- Include terms of service with responsible use guidelines
- Clarify that app is for personal productivity
- User assumes all responsibility for usage
- Not intended for cheating or deception
- Complies with OpenAI's usage policies

### Privacy Considerations

**Data Handling:**
- All data stored locally by default
- No telemetry without explicit consent
- API key never leaves device except for API calls
- Chat history never sent to third parties
- User can delete all data at any time

**Transparency:**
- Clear privacy policy
- Explain what data goes where
- Disclose all third-party services used (only OpenAI)
- Provide data export functionality
- Allow complete data deletion

### User Support

**Help Resources:**
- Comprehensive documentation
- Video tutorials
- FAQ section
- Troubleshooting guide
- Contact support option

**Community:**
- User forum or Discord (optional)
- Feature request system
- Bug reporting
- User feedback collection

---

## 📝 Final Notes

This application is designed to be a powerful, privacy-focused AI assistant for macOS that helps users during live conversations and meetings. The dual input system (text and voice) provides flexibility, while the ChatGPT-like interface ensures familiarity and ease of use.

Key differentiators:
- Native macOS app (not web-based)
- Screen share protection for privacy
- BlackHole integration for clean audio capture
- Canvas system for rich content display
- Complete local data storage
- Professional, polished UI

The implementation should prioritize:
1. **Reliability:** App must work consistently
2. **Performance:** Fast, responsive, smooth
3. **Privacy:** User data stays local and secure
4. **Usability:** Intuitive, easy to learn
5. **Aesthetics:** Beautiful, modern design

Remember: Start with MVP features, get user feedback, then iterate based on real usage patterns and requests.

---

**End of Technical Requirements Document**