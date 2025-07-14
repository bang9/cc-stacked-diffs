#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { spawn, ChildProcess } from 'child_process';
import { WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ElectronApp {
  process: ChildProcess;
  debugPort?: number;
  wsConnection?: WebSocket;
  pid?: number;
}

class ElectronDebugMCP {
  private server: Server;
  private electronApps: Map<string, ElectronApp> = new Map();

  constructor() {
    this.server = new Server(
      {
        name: 'cc-electron-debug-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'start_electron_app',
            description: 'Start the Claude Code Stacked Diffs Electron application in debug mode',
            inputSchema: {
              type: 'object',
              properties: {
                appPath: {
                  type: 'string',
                  description: 'Path to the Electron app (default: ../electron-app)',
                  default: '../electron-app'
                },
                debugPort: {
                  type: 'number',
                  description: 'Debug port for Chrome DevTools Protocol',
                  default: 5858
                }
              }
            }
          },
          {
            name: 'stop_electron_app',
            description: 'Stop the running Electron application',
            inputSchema: {
              type: 'object',
              properties: {
                appId: {
                  type: 'string',
                  description: 'Application ID to stop (default: main)',
                  default: 'main'
                }
              }
            }
          },
          {
            name: 'get_app_status',
            description: 'Get status of running Electron applications',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'inspect_main_process',
            description: 'Get main process debugging information',
            inputSchema: {
              type: 'object',
              properties: {
                appId: {
                  type: 'string',
                  description: 'Application ID to inspect',
                  default: 'main'
                }
              }
            }
          },
          {
            name: 'execute_dev_tools_command',
            description: 'Execute Chrome DevTools Protocol command',
            inputSchema: {
              type: 'object',
              properties: {
                appId: {
                  type: 'string',
                  description: 'Application ID',
                  default: 'main'
                },
                method: {
                  type: 'string',
                  description: 'DevTools Protocol method (e.g., Runtime.evaluate)'
                },
                params: {
                  type: 'object',
                  description: 'Parameters for the DevTools command'
                }
              },
              required: ['method']
            }
          },
          {
            name: 'get_console_logs',
            description: 'Get console logs from the Electron app',
            inputSchema: {
              type: 'object',
              properties: {
                appId: {
                  type: 'string',
                  description: 'Application ID',
                  default: 'main'
                },
                limit: {
                  type: 'number',
                  description: 'Number of recent logs to retrieve',
                  default: 50
                }
              }
            }
          }
        ] as Tool[],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'start_electron_app':
            return await this.startElectronApp(args);
          case 'stop_electron_app':
            return await this.stopElectronApp(args);
          case 'get_app_status':
            return await this.getAppStatus();
          case 'inspect_main_process':
            return await this.inspectMainProcess(args);
          case 'execute_dev_tools_command':
            return await this.executeDevToolsCommand(args);
          case 'get_console_logs':
            return await this.getConsoleLogs(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private async startElectronApp(args: any) {
    const appPath = args.appPath || '../electron-app';
    const debugPort = args.debugPort || 5858;
    const appId = 'main';

    // Stop existing app if running
    if (this.electronApps.has(appId)) {
      await this.stopElectronApp({ appId });
    }

    try {
      const appFullPath = path.resolve(__dirname, appPath);
      
      // Start Electron with debug flags
      const electronProcess = spawn('npx', [
        'electron',
        '--inspect=' + debugPort,
        '--remote-debugging-port=9222',
        '.'
      ], {
        cwd: appFullPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODE_ENV: 'development'
        }
      });

      const app: ElectronApp = {
        process: electronProcess,
        debugPort,
        pid: electronProcess.pid
      };

      this.electronApps.set(appId, app);

      // Setup process event handlers
      electronProcess.stdout?.on('data', (data) => {
        console.log(`[${appId}] stdout:`, data.toString());
      });

      electronProcess.stderr?.on('data', (data) => {
        console.error(`[${appId}] stderr:`, data.toString());
      });

      electronProcess.on('close', (code) => {
        console.log(`[${appId}] Process exited with code ${code}`);
        this.electronApps.delete(appId);
      });

      // Wait a bit for the app to start
      await new Promise(resolve => setTimeout(resolve, 3000));

      return {
        content: [
          {
            type: 'text',
            text: `Electron app started successfully!\n` +
                  `- App ID: ${appId}\n` +
                  `- PID: ${electronProcess.pid}\n` +
                  `- Debug port: ${debugPort}\n` +
                  `- Remote debugging: http://localhost:9222\n` +
                  `- App path: ${appFullPath}`
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to start Electron app: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async stopElectronApp(args: any) {
    const appId = args.appId || 'main';
    const app = this.electronApps.get(appId);

    if (!app) {
      return {
        content: [
          {
            type: 'text',
            text: `No running app found with ID: ${appId}`,
          },
        ],
      };
    }

    try {
      if (app.wsConnection) {
        app.wsConnection.close();
      }
      
      app.process.kill();
      this.electronApps.delete(appId);

      return {
        content: [
          {
            type: 'text',
            text: `Electron app ${appId} stopped successfully`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to stop app ${appId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getAppStatus() {
    const status: any[] = [];

    for (const [appId, app] of this.electronApps.entries()) {
      status.push({
        appId,
        pid: app.pid,
        debugPort: app.debugPort,
        isRunning: !app.process.killed,
        hasDebugConnection: !!app.wsConnection
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: `Running Electron Apps:\n${JSON.stringify(status, null, 2)}`,
        },
      ],
    };
  }

  private async inspectMainProcess(args: any) {
    const appId = args.appId || 'main';
    const app = this.electronApps.get(appId);

    if (!app) {
      throw new Error(`No running app found with ID: ${appId}`);
    }

    try {
      // Get debugging info from the main process
      const debugInfo = {
        pid: app.pid,
        debugPort: app.debugPort,
        remoteDebuggingUrl: `http://localhost:9222`,
        devToolsUrl: `chrome://inspect/#devices`,
        nodeInspectorUrl: `chrome-devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=localhost:${app.debugPort}`
      };

      return {
        content: [
          {
            type: 'text',
            text: `Main Process Debug Info for ${appId}:\n${JSON.stringify(debugInfo, null, 2)}\n\n` +
                  `To debug:\n` +
                  `1. Open Chrome and go to chrome://inspect/#devices\n` +
                  `2. Or open: ${debugInfo.nodeInspectorUrl}\n` +
                  `3. For renderer process, go to: ${debugInfo.remoteDebuggingUrl}`
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to inspect main process: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async executeDevToolsCommand(args: any) {
    const appId = args.appId || 'main';
    const { method, params = {} } = args;

    return {
      content: [
        {
          type: 'text',
          text: `DevTools command execution not yet implemented.\n` +
                `Requested: ${method} with params: ${JSON.stringify(params)}\n` +
                `For app: ${appId}\n\n` +
                `You can manually execute this in Chrome DevTools by:\n` +
                `1. Opening chrome://inspect/#devices\n` +
                `2. Clicking 'inspect' on the Electron process\n` +
                `3. Using the Console tab`
        },
      ],
    };
  }

  private async getConsoleLogs(args: any) {
    const appId = args.appId || 'main';
    const limit = args.limit || 50;

    return {
      content: [
        {
          type: 'text',
          text: `Console logs for ${appId} (last ${limit}):\n\n` +
                `Note: Console logs are currently captured in the terminal output.\n` +
                `For real-time logs, check the terminal where you started the MCP server.\n` +
                `For browser console logs, use Chrome DevTools at chrome://inspect/#devices`
        },
      ],
    };
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      // Clean up all running apps
      for (const [appId] of this.electronApps.entries()) {
        await this.stopElectronApp({ appId });
      }
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Claude Code Electron Debug MCP server running on stdio');
  }
}

const server = new ElectronDebugMCP();
server.run().catch(console.error);