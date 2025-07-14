import { useState, useEffect, useCallback } from 'react';
import { useGit } from './useGit';

interface ClaudeCodeSession {
  directory: string;
  workingDirectory: string;
  isActive: boolean;
  lastActivity: Date;
}

interface FileChangeEvent {
  workingDir: string;
  filename: string;
  eventType: string;
  timestamp: string;
}

export const useClaudeCodeIntegration = () => {
  const [sessions, setSessions] = useState<ClaudeCodeSession[]>([]);
  const [autoShowDiff, setAutoShowDiff] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const { refreshAll, currentRepo } = useGit();

  // Claude Code 세션 시작
  const startSession = useCallback(async (workingDir: string) => {
    try {
      const result = await window.electronAPI.claudeIntegration?.startSession(workingDir);
      if (result?.success) {
        // 세션 목록 새로고침
        const updatedSessions = await window.electronAPI.claudeIntegration?.getSessions();
        setSessions(updatedSessions || []);
        setIsListening(true);
        return result;
      }
      return result;
    } catch (error) {
      console.error('Failed to start Claude Code session:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Claude Code 세션 중지
  const stopSession = useCallback(async (workingDir: string) => {
    try {
      const result = await window.electronAPI.claudeIntegration?.stopSession(workingDir);
      if (result?.success) {
        const updatedSessions = await window.electronAPI.claudeIntegration?.getSessions();
        setSessions(updatedSessions || []);
        if (updatedSessions?.length === 0) {
          setIsListening(false);
        }
      }
      return result;
    } catch (error) {
      console.error('Failed to stop Claude Code session:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // 자동 diff 뷰 토글
  const toggleAutoShowDiff = useCallback(async (enabled: boolean) => {
    try {
      await window.electronAPI.claudeIntegration?.toggleAutoShowDiff(enabled);
      setAutoShowDiff(enabled);
    } catch (error) {
      console.error('Failed to toggle auto show diff:', error);
    }
  }, []);

  // 현재 프로젝트에 대한 세션 시작
  const startCurrentProjectSession = useCallback(() => {
    if (currentRepo) {
      return startSession(currentRepo);
    }
    return Promise.resolve({ success: false, message: 'No current repository' });
  }, [currentRepo, startSession]);

  // 파일 변경 이벤트 리스너 설정
  useEffect(() => {
    const handleFileChange = (event: FileChangeEvent) => {
      console.log('File changed:', event);
      
      // 현재 프로젝트와 관련된 변경사항인지 확인
      if (currentRepo && event.workingDir === currentRepo) {
        // 자동 새로고침이 활성화된 경우
        if (autoShowDiff) {
          setTimeout(() => {
            refreshAll();
          }, 500); // 짧은 지연 후 새로고침
        }
      }
    };

    const handleIterationComplete = (data: { workingDir: string; timestamp: string }) => {
      console.log('Claude Code iteration complete:', data);
      
      if (currentRepo && data.workingDir === currentRepo) {
        // 이터레이션 완료 시 diff 뷰 강제 새로고침
        refreshAll();
        
        // 사용자에게 알림 (선택사항)
        if (autoShowDiff) {
          // 여기에 토스트 알림이나 다른 UI 피드백 추가 가능
          console.log('Changes detected - refreshing diff view');
        }
      }
    };

    const handleTriggerRefresh = (data: { workingDir: string; filename: string; reason: string }) => {
      console.log('Trigger refresh:', data);
      
      if (currentRepo && data.workingDir === currentRepo && autoShowDiff) {
        refreshAll();
      }
    };

    // IPC 이벤트 리스너 등록
    if (window.electronAPI?.on) {
      window.electronAPI.on('claude-code:file-changed', handleFileChange);
      window.electronAPI.on('claude-code:iteration-complete', handleIterationComplete);
      window.electronAPI.on('claude-code:trigger-refresh', handleTriggerRefresh);
    }

    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
      if (window.electronAPI?.removeListener) {
        window.electronAPI.removeListener('claude-code:file-changed', handleFileChange);
        window.electronAPI.removeListener('claude-code:iteration-complete', handleIterationComplete);
        window.electronAPI.removeListener('claude-code:trigger-refresh', handleTriggerRefresh);
      }
    };
  }, [currentRepo, autoShowDiff, refreshAll]);

  // 초기 세션 목록 로드
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const currentSessions = await window.electronAPI.claudeIntegration?.getSessions();
        setSessions(currentSessions || []);
        setIsListening((currentSessions?.length || 0) > 0);
      } catch (error) {
        console.error('Failed to load sessions:', error);
      }
    };

    loadSessions();
  }, []);

  return {
    sessions,
    isListening,
    autoShowDiff,
    startSession,
    stopSession,
    toggleAutoShowDiff,
    startCurrentProjectSession,
  };
};