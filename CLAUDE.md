# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Arbaz Macbook is a real-time AI assistant desktop application for macOS. It's built with Electron, React, TypeScript, and Tailwind CSS, featuring dual text/voice input modes, streaming AI responses, and a **split-view UI** with:
- **Left Panel (50%)**: Realtime AI - Voice input → Text output (GPT-4o Realtime API)
- **Right Panel (50%)**: Traditional Chat - Text/Voice input → Text output (Chat Completions API)
- **Collapsed Sidebar**: Icon-only navigation (~60px width)

## Development Commands

### Running the Application
```bash
npm run dev              # Start Vite dev server + Electron app (recommended for development)
npm start               # Start Electron with existing build
npm run start:prod      # Build and run production version
```

### Building
```bash
npm run build           # Build React app with Vite (output: dist/)
npm run build:app       # Build + package Electron app (output: release/)
npm run preview         # Preview production build
```

### Code Quality
```bash
npm run lint            # Run ESLint
npx tsc --noEmit        # Type check without emitting files
```

## Architecture

### Two-Process Model (Electron)

**Main Process** (`electron/main.js`):
- Creates BrowserWindow with macOS-native styling (hiddenInset titlebar, custom traffic lights)
- Handles IPC communication for window controls (always-on-top, opacity, content protection)
- Manages microphone permissions via systemPreferences API
- Creates temporary AssemblyAI tokens for realtime transcription
- Loads either dev server (http://localhost:5173) or production build (dist/index.html)

**Renderer Process** (`src/`):
- React 18 application with TypeScript
- Communicates with main process via preload.js bridge (`window.electronAPI`)

### State Management (Zustand)

All application state lives in `src/store/index.ts`:
- **Chat state**: Current chat, message history, loading states
- **Settings**: API keys, model config, window preferences, audio settings
- **Voice state**: Recording status, processing flags, errors
- **Canvas**: Code blocks extracted from AI responses

Key pattern: Store actions call IndexedDB functions (`src/lib/db.ts`) to persist data, then update in-memory state.

### Data Persistence (IndexedDB)

Database: `arbaz-macbook` (version 3)
- **chats** object store: Chat objects with messages, indexed by `updatedAt`
- **settings** object store: Single settings object with key `app-settings`

Pattern: All CRUD operations go through `src/lib/db.ts` wrapper functions.

### AI Services Integration

**OpenAI** (`src/services/openai.ts`):
- `streamChatCompletion()`: Single streaming response via Chat Completions API
- `streamMultipleChatCompletions()`: Parallel multi-response generation (1-4 responses with incrementing temperatures)
- Uses Server-Sent Events (SSE) parsing for streaming chunks
- AbortController support for canceling streams

**AssemblyAI** (`src/services/assemblyai.ts`):
- Real-time streaming transcription via WebSocket
- Uses AudioWorklet (`PCMProcessor`) for robust PCM conversion (16-bit, 16kHz)
- Token-based authentication (tokens created in main process)
- Handles turn-based events for end-of-utterance detection

**Whisper** (`src/services/voice.ts`):
- Audio recording via MediaRecorder API
- Transcription via OpenAI Whisper API
- Simpler alternative to AssemblyAI for non-streaming use cases

**OpenAI Realtime API** (`src/services/realtime.ts`):
- WebRTC-based voice conversation mode
- Bidirectional audio streaming (not yet fully integrated in UI)

### Component Architecture

**Split-View Layout** (`src/App.tsx`):
1. **CollapsedSidebar** (`components/CollapsedSidebar.tsx`): Icon-only navigation with tooltips
   - New chat button
   - Chat list (shows 15 recent chats)
   - Settings button
2. **SplitViewContainer** (`components/SplitViewContainer.tsx`): Resizable 50/50 split
   - Draggable resize handle between panels
   - Left: **RealtimePanel** - GPT-4o Realtime API (voice → text)
   - Right: **TraditionalPanel** - Chat Completions API (text/voice → text)
3. **RealtimePanel** (`components/RealtimePanel.tsx`): Real-time voice conversations
   - Voice input with automatic speech detection (VAD)
   - Streaming text responses (NO audio output)
   - Ephemeral messages (not saved to history)
4. **TraditionalPanel** (`components/TraditionalPanel.tsx`): Classic chat interface
   - Uses existing `MessageList` and `ChatInput` components
   - Persistent chat history (saved to IndexedDB)
5. **CanvasPanel** (`components/CanvasPanel.tsx`): Code blocks with Prism.js syntax highlighting

**ChatInput Component** (`components/ChatInput.tsx`):
- Handles both text and voice modes
- For multi-response mode: creates placeholder messages, then streams into each via `updateMessageByIndex()`
- Voice mode branches:
  - Standard mic → MediaRecorder + Whisper transcription
  - System audio (BlackHole) → Real-time detection and routing
  - AssemblyAI → Streaming transcription with turn detection
- Uses AbortController for canceling in-flight requests

**Settings Component** (`components/Settings.tsx`):
- Comprehensive settings UI with multiple tabs/sections
- API key management (OpenAI, AssemblyAI)
- Model selection, temperature, max tokens
- Audio input source selection (microphone vs system audio)
- Response mode: normal, realtime, interview
- Response count: 1-4 parallel responses
- Window controls: always-on-top, opacity, screen protection

### Type System

All types defined in `src/types/index.ts`:
- `Message`: Supports `parentMessageId` and `responseIndex` for multi-response tracking
- `Chat`: Contains messages array and metadata
- `Settings`: Comprehensive settings including `responseCount`, `audioInputSource`, `responseMode`
- `ElectronAPI`: TypeScript interface for IPC bridge

## Key Implementation Patterns

### Multi-Response Feature
When `settings.responseCount > 1`:
1. Create placeholder assistant messages (empty content) with `parentMessageId` and `responseIndex`
2. Call `streamMultipleChatCompletions()` which runs N parallel requests with incrementing temperatures
3. Stream chunks into specific messages using `updateMessageByIndex(parentMessageId, responseIndex, chunk)`
4. UI displays responses in a grid (`ResponseGrid.tsx`)

### Message Streaming
- Assistant messages start empty, content appended via `updateLastMessage()` or `updateMessageByIndex()`
- Store keeps in-memory state updated in real-time (no DB writes during streaming)
- Final save to DB happens after stream completes

### Voice Input Modes
- **Microphone**: Standard recording → Whisper transcription → text submission
- **System Audio** (with BlackHole): Captures system audio → Real-time transcription
- **AssemblyAI Streaming**: Continuous transcription with turn detection → auto-submission on pause

### IPC Communication
Main → Renderer: Via preload.js context bridge (`window.electronAPI`)
```typescript
// Renderer calls:
await window.electronAPI.setAlwaysOnTop(true)
await window.electronAPI.createAssemblyAiToken(apiKey)
```

## Important Files to Know

- `electron/main.js`: Main process entry, IPC handlers
- `src/store/index.ts`: Global state and business logic
- `src/lib/db.ts`: Database operations
- `src/services/openai.ts`: Chat completions, multi-response logic
- `src/services/realtime.ts`: **GPT-4o Realtime API (text-only mode)**
- `src/services/audioManager.ts`: **Centralized audio input management**
- `src/components/App.tsx`: **Split-view layout orchestration**
- `src/components/CollapsedSidebar.tsx`: **Icon-only sidebar navigation**
- `src/components/SplitViewContainer.tsx`: **Resizable split panel container**
- `src/components/RealtimePanel.tsx`: **Realtime voice → text panel**
- `src/components/TraditionalPanel.tsx`: **Classic chat panel**
- `src/components/ChatInput.tsx`: Input handling, voice modes, multi-response submission
- `src/components/AudioInputSelector.tsx`: **Mic/System audio toggle component**
- `src/components/Settings.tsx`: All configuration UI
- `src/types/index.ts`: TypeScript definitions

## Development Notes

### Adding a New Setting
1. Add to `Settings` interface in `src/types/index.ts`
2. Add default value in `getDefaultSettings()` in `src/lib/db.ts`
3. Increment DB version in `initDB()` if schema changes
4. Add UI control in `src/components/Settings.tsx`
5. Use via `settings` from `useStore()`

### Adding a New AI Service
1. Create service file in `src/services/`
2. Add configuration to `Settings` interface
3. Add UI for API key/config in Settings component
4. Integrate into ChatInput component's submission flow

### Working with Voice Modes
- Microphone permissions must be granted (handled via Electron's systemPreferences)
- AssemblyAI requires temporary token creation (main process proxy to avoid CORS)
- System audio requires BlackHole or similar virtual audio device

### Streaming Response Pattern
```typescript
await streamChatCompletion(
  messages,
  apiKey,
  model,
  temperature,
  maxTokens,
  (chunk) => updateLastMessage(chunk),      // On each chunk
  () => saveChat(currentChat),              // On complete
  (error) => setVoiceState({ error }),      // On error
  abortSignal                               // Optional cancellation
)
```

## macOS-Specific Features

- **Traffic Light Positioning**: Custom positioned window controls
- **Content Protection**: Hides window during screen sharing
- **Always on Top**: Window stays above others during meetings
- **Microphone Permissions**: Prompts user, provides deep links to System Preferences
- **Build Output**: DMG and ZIP files via electron-builder

## Build Configuration

- **Electron Builder**: Config in `package.json` → `build` section
- **Vite**: `vite.config.ts` (React plugin, path alias `@`)
- **TypeScript**: `tsconfig.json` and `tsconfig.node.json`
- **Tailwind**: `tailwind.config.js` + `postcss.config.js`

## Environment Variables

- `VITE_DEV_SERVER_URL`: Set by dev script, tells Electron where to load app
- No `.env` file by default; API keys stored in IndexedDB

## Split-View Architecture (v3.0)

### Key Changes from v2.0
- **Removed**: AssemblyAI integration (no longer needed)
- **Added**: Split-view layout with Realtime + Traditional panels side-by-side
- **Added**: Collapsed sidebar for space efficiency
- **Added**: Resizable panel divider (20%-80% range)
- **Updated**: Realtime API configured for text-only output (no audio playback)

### Panel Communication
- **Realtime Panel**: Independent state, manages own WebSocket connection
- **Traditional Panel**: Uses global Zustand store for chat persistence
- **Audio Input**: Both panels can use microphone or system audio (BlackHole)
- **No Conflicts**: AudioManager service prevents simultaneous access issues

### UI Layout Breakdown
```
┌──────────────────────────────────────────────────────────┐
│  TitleBar (Custom macOS traffic lights)                  │
├──┬─────────────────────────┬─────────────────────────────┤
│  │  REALTIME PANEL (50%)  │  TRADITIONAL PANEL (50%)   │
│🤖│  ┌─────────────────────┐ │ ┌──────────────────────┐  │
│  │  │ 🎤 Listening...     │ │ │ User: Hello          │  │
│➕│  │ (VAD Active)        │ │ │ AI: Hi there!        │  │
│💬│  └─────────────────────┘ │ └──────────────────────┘  │
│💬│  AI: Response text...   │ [Type message...]         │
│⚙ │  [Mic|System] [Connect] │ [Mic|System] [Send]       │
└──┴─────────────────────────┴─────────────────────────────┘
 ↑ Collapsed Sidebar (60px)
```

### Best Practices
- Realtime panel: Use for quick voice queries, exploratory conversation
- Traditional panel: Use for persistent conversations, multi-turn context
- Both support mic + BlackHole (system audio capture)
- Realtime messages are ephemeral (not saved to DB)
- Traditional messages persist in IndexedDB
