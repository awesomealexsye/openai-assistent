# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Arbaz Macbook is a real-time AI assistant desktop application for macOS. It's built with Electron, React, TypeScript, and Tailwind CSS, featuring dual text/voice input modes, streaming AI responses, and a three-panel UI (sidebar, chat, canvas).

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

**Three-Panel Layout** (`src/App.tsx`):
1. **Sidebar** (`components/Sidebar.tsx`): Chat list, new chat button, settings
2. **ChatPanel** (`components/ChatPanel.tsx`): Message display with `MessageList` and `ChatInput`
3. **CanvasPanel** (`components/CanvasPanel.tsx`): Code blocks with Prism.js syntax highlighting

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
- `src/services/assemblyai.ts`: Real-time transcription
- `src/components/ChatInput.tsx`: Input handling, voice modes, multi-response submission
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
