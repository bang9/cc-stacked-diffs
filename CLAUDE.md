# Claude Code Configuration

This file contains configuration and context for Claude Code when working on this project.

## Project Overview

**Claude Code Stacked Diffs** is a macOS desktop application that enables systematic code review for changes generated by Claude Code. It implements a stacked diffs workflow to break down large changes into manageable review steps.

## Architecture

```
cc-stacked-diffs/ (monorepo)
├── packages/
│   ├── electron-app/          # Main Electron application
│   │   ├── src/main/          # Electron main process
│   │   ├── src/renderer/      # React UI (uses @cc-stacked-diffs/ui)
│   │   └── src/shared/        # Shared types
│   ├── ui/                    # Reusable UI components library
│   │   ├── src/components/    # shadcn/ui based components
│   │   │   ├── ui/           # Base shadcn/ui components
│   │   │   ├── DiffViewer.tsx
│   │   │   ├── GitStatus.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   └── src/lib/          # Utilities (cn, etc.)
│   └── mcp-electron-debug/    # Custom MCP server for debugging
└── README.md
```

## Tech Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS v4
- **UI Components**: shadcn/ui with Radix UI primitives
- **Component Architecture**: Monorepo with dedicated UI package (@cc-stacked-diffs/ui)
- **Desktop**: Electron 37 with Vite build system
- **State Management**: Zustand + React Query
- **Git Integration**: simple-git library
- **Code Editor**: Monaco Editor (VS Code engine)
- **Development**: Custom MCP server for debugging

## Key Features

### Core Functionality
- Git diff visualization with syntax highlighting
- Step-by-step code review workflow
- Stacked diffs with dependency management
- Real-time Git status monitoring
- File staging and commit management

### Claude Code Integration
- Automatic file change detection
- Real-time diff view refresh on iteration completion
- Session management for active monitoring
- Auto-refresh toggle for seamless development

### MCP Integration
- **Playwright MCP**: Browser automation and testing workflows
- **Context7 MCP**: Real-time access to React, shadcn/ui, and other library documentation during development
- **Custom Electron Debug MCP**: Application debugging and process inspection tools

## Development Commands

### Root Level (Monorepo)
```bash
npm run dev          # Start Electron app development
npm run build        # Build Electron app
npm run dev:debug    # Start with hot reload + debug mode
npm run dev:mcp      # Start custom MCP debug server
npm run build:all    # Build all packages
```

### Electron App
```bash
cd packages/electron-app
npm run dev:debug    # Start with auto-reload
npm run build        # Build for production
npm run electron     # Run built app
npm run lint         # Run ESLint
npm run format       # Format with Prettier
```

### UI Package
```bash
cd packages/ui
npm run build        # Build UI library for distribution
npm run dev          # Build in watch mode for development
npm run lint         # Run ESLint on UI components
npm run typecheck    # Type checking without emit
npx shadcn@latest add <component>  # Add new shadcn/ui components
```

### MCP Debug Server
```bash
cd packages/mcp-electron-debug
npm run dev          # Start in watch mode
npm run build        # Build TypeScript
npm run start        # Run built server
```

## File Structure Context

### Main Process (`packages/electron-app/src/main/`)
- `index.ts` - Main Electron entry point
- `preload.ts` - Secure IPC bridge
- `services/gitService.ts` - Git operations and IPC handlers
- `services/claudeCodeIntegration.ts` - File watching and Claude Code integration

### Renderer Process (`packages/electron-app/src/renderer/`)
- `components/` - Application-specific React components
  - `WelcomeMessage.tsx` - Welcome screen for project selection
  - `ReviewWorkflow.tsx` - Review step creation dialog
  - `ClaudeCodeIntegration.tsx` - Claude Code monitoring controls
  - `ReviewStepActions.tsx` - Review step management actions
- `hooks/` - Custom React hooks
  - `useGit.ts` - Git operations
  - `useClaudeCodeIntegration.ts` - File monitoring
- `store/useStore.ts` - Zustand state management
- `App.tsx` - Main application component using @cc-stacked-diffs/ui

### UI Package (`packages/ui/src/`)
- `components/` - Reusable UI components
  - `ui/` - Base shadcn/ui components (Button, Card, Dialog, etc.)
  - `DiffViewer.tsx` - Main diff visualization component
  - `GitStatus.tsx` - Git status display component
  - `Sidebar.tsx` - Navigation and controls component
  - `Header.tsx` - Application header component
  - `ProjectSelector.tsx` - Project selection component
- `lib/utils.ts` - Utility functions (cn, etc.)
- `index.css` - Global styles and CSS variables
- `index.ts` - Package exports

### Shared (`packages/electron-app/src/shared/`)
- `types.ts` - TypeScript interfaces and types

## Important Implementation Details

### UI Component Architecture
- **Monorepo Design**: Separate UI package (@cc-stacked-diffs/ui) for component reusability
- **shadcn/ui Integration**: Modern, accessible components based on Radix UI primitives
- **Component Props**: All UI components accept props for data and event handlers, making them highly reusable
- **Design System**: Consistent styling using Tailwind CSS v4 with CSS variables for theming
- **TypeScript**: Strict typing for all component props and interfaces

### shadcn/ui Integration
- **Base Components**: Button, Card, Dialog, Tooltip, Tabs, Input, Select, Accordion, Badge, Separator
- **Custom Styling**: CSS variables system for consistent theming across light/dark modes
- **Accessibility**: Built-in ARIA support and keyboard navigation from Radix UI
- **Performance**: Tree-shakable imports and optimized bundle size

### Git Integration
- Uses `simple-git` for Git operations
- Serializes Git status objects for IPC compatibility
- Supports staging, unstaging, and diff viewing
- Real-time status monitoring with 5-second refresh

### Stacked Diffs
- Parent-child relationship tracking
- Dependency validation (parent must be approved first)
- Visual hierarchy in sidebar
- Independent review workflows per stack

### Claude Code Integration
- File system watching with Node.js `fs.watch`
- 3-second iteration completion detection
- Automatic diff refresh on file changes
- Session management with start/stop controls

### Security
- Context isolation enabled
- Node integration disabled
- Preload script for secure IPC
- Validated IPC channels

## Testing Strategy

### Manual Testing
1. Start app with `npm run dev:debug`
2. Select this monorepo as test project
3. Enable Claude Code monitoring
4. Make changes via Claude Code
5. Verify automatic diff refresh
6. Create and review diff steps

### MCP Testing
```bash
# Test custom MCP server
start_electron_app
get_app_status
inspect_main_process
stop_electron_app

# Test context7 MCP for documentation
# Automatically available during development for:
# - React documentation and examples
# - shadcn/ui component references
# - Radix UI primitives documentation
# - Tailwind CSS utilities
```

### Integration Testing
- File change detection accuracy
- Diff parsing and visualization
- Review workflow state management
- Git operation reliability

## Common Issues and Solutions

### Build Issues
- Ensure all Node.js modules are externalized in Vite config
- Check TypeScript configuration for proper module resolution
- Verify Electron Forge configuration for packaging

### Git Integration
- Repository must be a valid Git repo
- File permissions for Git operations
- Handle large diffs gracefully

### IPC Issues
- Ensure objects are serializable (no functions)
- Use proper error handling in async operations
- Validate IPC channel names

## Performance Considerations

- Debounce file change events (1-second delay)
- Limit diff size for large files
- Virtual scrolling for large file lists
- Efficient Git status polling

## Future Enhancements

1. **Terminal Chat View**: Embedded Claude Code chat interface
2. **Advanced Diff Tools**: Better merge conflict resolution with enhanced UI components
3. **Team Collaboration**: Shared review sessions with real-time UI updates
4. **Plugin System**: Extensible architecture with component-based plugins
5. **Cloud Sync**: Cross-device session management
6. **Theme System**: Advanced theming support with custom CSS variables
7. **Component Library**: Publish @cc-stacked-diffs/ui as standalone package
8. **Accessibility**: Enhanced ARIA support and keyboard navigation
9. **Performance**: Virtual scrolling and code splitting optimizations

## Development Workflow

### Dog Fooding Process
1. Use Claude Code to implement new features
2. Monitor changes with the app itself
3. Create review steps for systematic review
4. Use MCP tools for debugging
5. Iterate and improve based on usage

### Code Standards
- TypeScript strict mode enabled
- ESLint + Prettier for code formatting
- React functional components with hooks
- Async/await for promises
- Proper error handling and logging

## Deployment

### Building for Distribution
```bash
npm run build:all
cd packages/electron-app
npm run make
```

### macOS App Store
- Configure app signing and notarization
- Update Info.plist for store requirements
- Test with Gatekeeper enabled

This project represents a novel approach to AI-assisted development tools, enabling developers to systematically review and manage changes generated by Claude Code through an intuitive desktop interface.