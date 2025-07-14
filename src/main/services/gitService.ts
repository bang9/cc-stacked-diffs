import simpleGit, { SimpleGit } from 'simple-git';
import { ipcMain, dialog } from 'electron';
import path from 'path';

class GitService {
  private git: SimpleGit | null = null;
  private repoPath: string | null = null;

  async initialize(repoPath: string) {
    this.repoPath = repoPath;
    this.git = simpleGit(repoPath);
    
    // Verify it's a git repository
    const isRepo = await this.git.checkIsRepo();
    if (!isRepo) {
      throw new Error('Not a git repository');
    }
    
    return true;
  }

  async getStatus() {
    if (!this.git) throw new Error('Git not initialized');
    return await this.git.status();
  }

  async getDiff(staged: boolean = false) {
    if (!this.git) throw new Error('Git not initialized');
    
    const args = staged ? ['--cached'] : [];
    const diff = await this.git.diff(args);
    
    return this.parseDiff(diff);
  }

  async getFileDiff(filePath: string, staged: boolean = false) {
    if (!this.git) throw new Error('Git not initialized');
    
    const args = staged ? ['--cached', filePath] : [filePath];
    const diff = await this.git.diff(args);
    
    return this.parseDiff(diff);
  }

  async stageFile(filePath: string) {
    if (!this.git) throw new Error('Git not initialized');
    await this.git.add(filePath);
  }

  async unstageFile(filePath: string) {
    if (!this.git) throw new Error('Git not initialized');
    await this.git.reset(['HEAD', filePath]);
  }

  async commit(message: string) {
    if (!this.git) throw new Error('Git not initialized');
    return await this.git.commit(message);
  }

  private parseDiff(diff: string) {
    const files: any[] = [];
    const lines = diff.split('\n');
    let currentFile: any = null;
    
    for (const line of lines) {
      if (line.startsWith('diff --git')) {
        if (currentFile) {
          files.push(currentFile);
        }
        
        const match = line.match(/a\/(.*) b\/(.*)/);
        if (match) {
          currentFile = {
            oldPath: match[1],
            newPath: match[2],
            hunks: [],
            additions: 0,
            deletions: 0,
          };
        }
      } else if (line.startsWith('@@') && currentFile) {
        const hunkHeader = line;
        const hunk = {
          header: hunkHeader,
          lines: [],
        };
        currentFile.hunks.push(hunk);
      } else if (currentFile && currentFile.hunks.length > 0) {
        const lastHunk = currentFile.hunks[currentFile.hunks.length - 1];
        lastHunk.lines.push(line);
        
        if (line.startsWith('+') && !line.startsWith('+++')) {
          currentFile.additions++;
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          currentFile.deletions++;
        }
      }
    }
    
    if (currentFile) {
      files.push(currentFile);
    }
    
    return files;
  }
}

const gitService = new GitService();

// IPC handlers
ipcMain.handle('git:initialize', async (event, repoPath: string) => {
  try {
    await gitService.initialize(repoPath);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('git:status', async () => {
  try {
    const status = await gitService.getStatus();
    return { success: true, data: status };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('git:diff', async (event, options: { staged?: boolean }) => {
  try {
    const diff = await gitService.getDiff(options.staged);
    return { success: true, data: diff };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('git:fileDiff', async (event, filePath: string, staged: boolean) => {
  try {
    const diff = await gitService.getFileDiff(filePath, staged);
    return { success: true, data: diff };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('git:stage', async (event, filePath: string) => {
  try {
    await gitService.stageFile(filePath);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('git:unstage', async (event, filePath: string) => {
  try {
    await gitService.unstageFile(filePath);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('dialog:selectDirectory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  
  return null;
});

export default gitService;