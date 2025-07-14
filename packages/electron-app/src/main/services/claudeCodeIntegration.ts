import { ipcMain } from 'electron';
import { watch } from 'fs';
import path from 'path';

interface ClaudeCodeSession {
  workingDirectory: string;
  isActive: boolean;
  lastActivity: Date;
}

class ClaudeCodeIntegration {
  private sessions: Map<string, ClaudeCodeSession> = new Map();
  private watchers: Map<string, any> = new Map();

  constructor() {
    this.setupIPC();
  }

  private setupIPC() {
    // Claude Code 세션 시작 감지
    ipcMain.handle('claude-integration:start-session', async (event, workingDir: string) => {
      return this.startSession(workingDir);
    });

    // Claude Code 세션 종료
    ipcMain.handle('claude-integration:stop-session', async (event, workingDir: string) => {
      return this.stopSession(workingDir);
    });

    // 활성 세션 목록
    ipcMain.handle('claude-integration:get-sessions', async () => {
      return Array.from(this.sessions.entries()).map(([dir, session]) => ({
        directory: dir,
        ...session
      }));
    });

    // 자동 diff 뷰 토글
    ipcMain.handle('claude-integration:toggle-auto-diff', async (event, enabled: boolean) => {
      // 자동 diff 뷰 설정 저장
      return { autoShowDiff: enabled };
    });
  }

  startSession(workingDir: string) {
    const normalizedPath = path.resolve(workingDir);
    
    // 기존 세션이 있으면 업데이트
    if (this.sessions.has(normalizedPath)) {
      const session = this.sessions.get(normalizedPath)!;
      session.isActive = true;
      session.lastActivity = new Date();
      return { success: true, message: 'Session reactivated' };
    }

    // 새 세션 생성
    const session: ClaudeCodeSession = {
      workingDirectory: normalizedPath,
      isActive: true,
      lastActivity: new Date()
    };

    this.sessions.set(normalizedPath, session);
    this.startFileWatching(normalizedPath);

    return { 
      success: true, 
      message: `Claude Code session started for ${normalizedPath}`,
      sessionId: normalizedPath
    };
  }

  stopSession(workingDir: string) {
    const normalizedPath = path.resolve(workingDir);
    
    if (this.sessions.has(normalizedPath)) {
      this.sessions.delete(normalizedPath);
      this.stopFileWatching(normalizedPath);
      return { success: true, message: 'Session stopped' };
    }

    return { success: false, message: 'Session not found' };
  }

  private startFileWatching(workingDir: string) {
    if (this.watchers.has(workingDir)) {
      return; // 이미 감시 중
    }

    try {
      // Git 저장소 파일 변경 감지
      const watcher = watch(workingDir, { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        
        // .git 폴더 변경 무시
        if (filename.includes('.git/')) return;
        
        // 숨김 파일 무시 (node_modules, dist 등)
        if (filename.startsWith('.') || 
            filename.includes('node_modules') || 
            filename.includes('dist/') ||
            filename.includes('.DS_Store')) {
          return;
        }

        this.handleFileChange(workingDir, filename, eventType);
      });

      this.watchers.set(workingDir, watcher);
    } catch (error) {
      console.error('Failed to start file watching:', error);
    }
  }

  private stopFileWatching(workingDir: string) {
    const watcher = this.watchers.get(workingDir);
    if (watcher) {
      watcher.close();
      this.watchers.delete(workingDir);
    }
  }

  private async handleFileChange(workingDir: string, filename: string, eventType: string) {
    const session = this.sessions.get(workingDir);
    if (!session || !session.isActive) return;

    // 세션 활동 업데이트
    session.lastActivity = new Date();

    // 렌더러 프로세스에 파일 변경 알림
    const windows = require('electron').BrowserWindow.getAllWindows();
    windows.forEach(window => {
      window.webContents.send('claude-code:file-changed', {
        workingDir,
        filename,
        eventType,
        timestamp: new Date().toISOString()
      });
    });

    // 특정 조건에서 자동으로 diff 뷰 새로고침
    this.triggerAutoRefresh(workingDir, filename);
  }

  private triggerAutoRefresh(workingDir: string, filename: string) {
    // TypeScript, JavaScript, JSON 파일 변경 시 자동 새로고침
    const autoRefreshExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'];
    const fileExt = path.extname(filename);
    
    if (autoRefreshExtensions.includes(fileExt)) {
      setTimeout(() => {
        const windows = require('electron').BrowserWindow.getAllWindows();
        windows.forEach(window => {
          window.webContents.send('claude-code:trigger-refresh', {
            workingDir,
            filename,
            reason: 'auto-refresh'
          });
        });
      }, 1000); // 1초 지연 후 새로고침
    }
  }

  // Claude Code 이터레이션 완료 신호 감지
  detectIterationComplete(workingDir: string) {
    // 이터레이션 완료를 감지하는 로직
    // 예: 연속된 파일 변경이 멈춘 후 3초 경과
    const session = this.sessions.get(workingDir);
    if (!session) return;

    setTimeout(() => {
      const windows = require('electron').BrowserWindow.getAllWindows();
      windows.forEach(window => {
        window.webContents.send('claude-code:iteration-complete', {
          workingDir,
          timestamp: new Date().toISOString()
        });
      });
    }, 3000);
  }
}

export default new ClaudeCodeIntegration();