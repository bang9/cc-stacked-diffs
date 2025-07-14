export interface GitStatus {
  ahead: number;
  behind: number;
  current: string;
  tracking: string | null;
  files: any[];
  isClean: boolean;
  staged: string[];
  created: string[];
  deleted: string[];
  modified: string[];
  renamed: string[];
  conflicted: string[];
  not_added: string[];
}

export interface GitDiffFile {
  oldPath: string;
  newPath: string;
  hunks: Array<{
    header: string;
    lines: string[];
  }>;
  additions: number;
  deletions: number;
}

export interface GitResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ElectronAPI {
  git: {
    initialize: (repoPath: string) => Promise<GitResponse<boolean>>;
    status: () => Promise<GitResponse<GitStatus>>;
    diff: (options: { staged?: boolean }) => Promise<GitResponse<GitDiffFile[]>>;
    fileDiff: (filePath: string, staged: boolean) => Promise<GitResponse<GitDiffFile[]>>;
    stage: (filePath: string) => Promise<GitResponse<void>>;
    unstage: (filePath: string) => Promise<GitResponse<void>>;
  };
  selectDirectory: () => Promise<string | null>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}