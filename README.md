# AI Meeting Assistant

A real-time AI meeting assistant for macOS with dual text/voice input, built with Electron, React, TypeScript, and Tailwind CSS.

## Features

### Core Functionality
- **Dual Input Modes**: Switch between text and voice input seamlessly
- **OpenAI Integration**:
  - Chat Completion API for text conversations with streaming responses
  - Whisper API for voice-to-text transcription
- **Three-Panel Layout**: Sidebar (chat history) + Main Chat + Canvas (code display)
- **Local Storage**: All chat history stored locally using IndexedDB
- **Code Syntax Highlighting**: Automatic code detection and highlighting with Prism.js

### Privacy & Window Management
- **Always-on-Top Mode**: Keep the window above all others during meetings
- **Screen Protection**: Automatically hide window during screen sharing
- **Adjustable Opacity**: Set window transparency (50%-100%)
- **macOS Native**: Custom traffic light positioning and inset title bar

### User Experience
- **Dark/Light Theme**: System-integrated theme switcher
- **Real-time Streaming**: See AI responses as they're generated
- **Model Selection**: Choose between GPT-4 Turbo, GPT-4, and GPT-3.5 Turbo
- **Temperature Control**: Adjust AI creativity/precision
- **Glass Morphism UI**: Modern, beautiful interface design

## Tech Stack

- **Electron 28**: Desktop app framework
- **React 18**: UI library
- **TypeScript**: Type-safe development
- **Vite**: Fast build tooling
- **Tailwind CSS**: Utility-first styling
- **Zustand**: Lightweight state management
- **IndexedDB (idb)**: Local database
- **Prism.js**: Syntax highlighting
- **OpenAI API**: AI completions and transcriptions

## Prerequisites

- Node.js 18+
- macOS 10.15+ (Catalina or later)
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))

## Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd /Users/arbazkhan/projects/ai-project/openaiassistent
   ```

2. **Dependencies are already installed**. If you need to reinstall:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

   This will:
   - Start Vite dev server on http://localhost:5173
   - Launch Electron app automatically

4. **First-time setup**:
   - Click the "Settings" button in the sidebar
   - Enter your OpenAI API key
   - Test the API key using the "Test" button
   - Choose your preferred model and settings
   - Click "Save Changes"

## Usage

### Text Input Mode
1. Click "New Chat" in the sidebar
2. Type your message in the input box
3. Press Enter to send (Shift+Enter for new line)
4. Watch the AI response stream in real-time

### Voice Input Mode
1. Click the microphone icon
2. Speak your message
3. Click the mic icon again to stop recording
4. Your speech will be transcribed and sent automatically

### Code Display
- Code blocks in AI responses are automatically detected
- Displayed with syntax highlighting in the Canvas panel
- Click the copy button to copy code to clipboard

### Window Controls
Access from Settings:
- **Always on Top**: Keep window above all others
- **Screen Protection**: Hide during screen sharing
- **Window Opacity**: Adjust transparency slider

## Project Structure

```
├── electron/               # Electron main process
│   ├── main.js            # Main process entry point
│   └── preload.js         # Preload script for IPC
├── src/
│   ├── components/        # React components
│   │   ├── Sidebar.tsx    # Chat list sidebar
│   │   ├── ChatPanel.tsx  # Main chat interface
│   │   ├── ChatInput.tsx  # Text/voice input
│   │   ├── MessageList.tsx # Message display
│   │   ├── CanvasPanel.tsx # Code display panel
│   │   └── Settings.tsx   # Settings modal
│   ├── services/          # API services
│   │   ├── openai.ts      # OpenAI API integration
│   │   └── voice.ts       # Voice recording/transcription
│   ├── store/             # State management
│   │   └── index.ts       # Zustand store
│   ├── lib/               # Utilities
│   │   └── db.ts          # IndexedDB operations
│   ├── types/             # TypeScript types
│   │   └── index.ts       # Type definitions
│   ├── App.tsx            # Root component
│   ├── main.tsx           # React entry point
│   └── index.css          # Global styles
├── public/                # Static assets
├── index.html             # HTML entry point
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── vite.config.ts         # Vite config
└── tailwind.config.js     # Tailwind config
```

## Building for Production

Build the app for distribution:

```bash
npm run build
```

This will:
1. Compile TypeScript
2. Build React app with Vite
3. Package Electron app with electron-builder
4. Generate DMG and ZIP files in the `release/` directory

## Configuration

### API Settings
Configure in the Settings panel:
- **API Key**: Your OpenAI API key
- **Model**: gpt-4-turbo-preview, gpt-4, or gpt-3.5-turbo
- **Temperature**: 0.0 (precise) to 2.0 (creative)
- **Max Tokens**: 256 to 8192

### Window Settings
- **Always on Top**: Boolean
- **Screen Protection**: Boolean
- **Opacity**: 0.5 to 1.0

### Theme
- Dark or Light mode

## Keyboard Shortcuts

- **Enter**: Send message
- **Shift + Enter**: New line in input
- **Cmd + ,**: Open settings (when implemented)

## Troubleshooting

### App won't start
- Make sure Node.js 18+ is installed
- Try removing `node_modules` and running `npm install` again
- Check if port 5173 is available

### API key issues
- Verify your API key at https://platform.openai.com/api-keys
- Ensure you have credits in your OpenAI account
- Check your internet connection

### Voice input not working
- Grant microphone permissions when prompted
- Check System Preferences > Security & Privacy > Microphone
- Make sure your microphone is properly connected

### Database issues
- Clear IndexedDB data: Chrome DevTools > Application > IndexedDB
- Or delete the database: `~/Library/Application Support/ai-meeting-assistant`

## Development

### Running in Development Mode
```bash
npm run dev
```

### Type Checking
```bash
npx tsc --noEmit
```

### Linting
```bash
npm run lint
```

## Privacy & Security

- **All data stored locally**: Chat history is saved in IndexedDB on your machine
- **No telemetry**: The app doesn't send any usage data
- **API key storage**: Stored locally in IndexedDB (consider using system keychain in production)
- **Screen sharing protection**: Content automatically hidden when sharing screen

## Known Limitations

- macOS only (Windows/Linux support requires additional configuration)
- Voice input requires internet connection (OpenAI Whisper API)
- Real-time voice (OpenAI Realtime API) not yet implemented

## Future Enhancements

- [ ] OpenAI Realtime API for voice conversations
- [ ] Function calling support
- [ ] Export chat history
- [ ] Custom system prompts
- [ ] Multi-language support
- [ ] Windows and Linux builds
- [ ] Auto-updates

## License

MIT

## Support

For issues or questions, please file an issue on the GitHub repository.

---

**Built with Claude Code** - An AI-powered development assistant by Anthropic
