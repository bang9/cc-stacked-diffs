# Claude Code Stacked Diffs - Monorepo

A monorepo containing the Claude Code Stacked Diffs review tool and its custom MCP debugging server.

## 📁 Project Structure

```
cc-stacked-diffs/
├── packages/
│   ├── electron-app/          # Main Electron application
│   │   ├── src/               # Source code for the app
│   │   ├── dist/              # Build outputs
│   │   └── package.json       # App dependencies
│   └── mcp-electron-debug/    # Custom MCP server for debugging
│       ├── src/               # MCP server source
│       ├── dist/              # MCP server build
│       └── package.json       # MCP server dependencies
├── package.json               # Monorepo configuration
└── README.md                  # This file
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
npm run install:all
```

### 2. Build All Packages
```bash
npm run build:all
```

### 3. Start Development

#### Option A: Regular Development
```bash
# Start the Electron app
npm run dev:debug
```

#### Option B: Dog Fooding with MCP Debug Server
```bash
# Terminal 1: Start the MCP debug server
npm run dev:mcp

# Terminal 2: Add MCP server to Claude Code
claude mcp add cc-electron-debug "node" "$(pwd)/packages/mcp-electron-debug/dist/index.js"

# Terminal 3: Start Claude Code with MCP support
# Now you can use the MCP server to debug the Electron app!
```

## 🔧 MCP Electron Debug Server

Our custom MCP server provides these debugging capabilities:

### Available Tools

1. **start_electron_app** - Start the Electron app in debug mode
2. **stop_electron_app** - Stop the running Electron app  
3. **get_app_status** - Get status of running apps
4. **inspect_main_process** - Get debugging URLs and info
5. **execute_dev_tools_command** - Execute Chrome DevTools commands
6. **get_console_logs** - Retrieve console logs

### Usage in Claude Code

```bash
# Start debugging the Electron app
start_electron_app

# Check what's running
get_app_status

# Get debug URLs for Chrome DevTools
inspect_main_process

# Stop the app when done
stop_electron_app
```

## 🐕 Dog Fooding Workflow

1. **Setup MCP Server**: The MCP server can control and debug the Electron app
2. **Start Development**: Use Claude Code to develop new features
3. **Debug Issues**: Use MCP tools to inspect the running app
4. **Create Review Steps**: Use the app itself to review your changes
5. **Iterate**: Make improvements and repeat

## 📦 Package Scripts

### Root Level
- `npm run dev` - Start Electron app development
- `npm run build` - Build Electron app
- `npm run dev:mcp` - Start MCP debug server
- `npm run build:all` - Build all packages
- `npm run install:all` - Install all dependencies

### Electron App (`packages/electron-app`)
- `npm run dev:debug` - Start with hot reload + debug mode
- `npm run build` - Build for production
- `npm run electron` - Run built app

### MCP Debug Server (`packages/mcp-electron-debug`)
- `npm run dev` - Start in watch mode
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Run built server

## 🛠️ Development Tips

1. **MCP Integration**: Use the custom MCP server to automate debugging workflows
2. **Live Debugging**: Chrome DevTools integration for real-time inspection
3. **Self-Testing**: Use the app to review its own code changes
4. **Rapid Iteration**: Hot reload for quick development cycles

## 📖 Documentation

- [Electron App Documentation](./packages/electron-app/README.md)
- [MCP Server Documentation](./packages/mcp-electron-debug/README.md)
- [Original PRD](./packages/electron-app/PRD.md)

This monorepo setup enables powerful dog fooding workflows where you can use Claude Code with MCP to develop, debug, and review the Electron app itself!