# Claude Code Stacked Diffs

A macOS desktop application for reviewing code changes from Claude Code in a stacked diffs workflow.

## Features

- Visual diff viewer for code changes
- Step-by-step review workflow
- Stacked diffs support
- Git integration
- Native macOS experience

## Tech Stack

- Electron + React + TypeScript
- Monaco Editor for code viewing
- Tailwind CSS for styling
- Zustand for state management
- simple-git for Git operations

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# In another terminal, start Electron
npm run electron:dev

# Build for production
npm run build
npm run make
```

## Architecture

The app consists of:
- **Main Process**: Handles Git operations and system integration
- **Renderer Process**: React app for the UI
- **Preload Script**: Secure bridge between main and renderer

## License

ISC