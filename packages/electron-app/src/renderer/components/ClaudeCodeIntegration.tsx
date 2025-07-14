import React, { useState } from 'react';
import { useClaudeCodeIntegration } from '../hooks/useClaudeCodeIntegration';
import { useGit } from '../hooks/useGit';

const ClaudeCodeIntegration: React.FC = () => {
  const { 
    sessions, 
    isListening, 
    autoShowDiff, 
    startCurrentProjectSession, 
    stopSession,
    toggleAutoShowDiff 
  } = useClaudeCodeIntegration();
  
  const { currentRepo } = useGit();
  const [isStarting, setIsStarting] = useState(false);

  const handleStartSession = async () => {
    if (!currentRepo) {
      alert('Please select a Git repository first');
      return;
    }

    setIsStarting(true);
    try {
      const result = await startCurrentProjectSession();
      if (result.success) {
        console.log('Claude Code session started successfully');
      } else {
        console.error('Failed to start session:', result.message);
      }
    } catch (error) {
      console.error('Error starting session:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopSession = async () => {
    if (!currentRepo) return;

    try {
      const result = await stopSession(currentRepo);
      if (result.success) {
        console.log('Claude Code session stopped');
      }
    } catch (error) {
      console.error('Error stopping session:', error);
    }
  };

  const currentSession = sessions.find(s => s.workingDirectory === currentRepo);

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Claude Code Integration
        </h3>
        <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-400' : 'bg-gray-600'}`} />
      </div>

      {currentRepo ? (
        <div className="space-y-3">
          {/* 세션 상태 */}
          <div className="text-sm">
            <span className="text-gray-400">Status: </span>
            <span className={currentSession?.isActive ? 'text-green-400' : 'text-gray-500'}>
              {currentSession?.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          {/* 자동 diff 뷰 토글 */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Auto-refresh diff view</span>
            <button
              onClick={() => toggleAutoShowDiff(!autoShowDiff)}
              className={`w-10 h-6 rounded-full transition-colors ${
                autoShowDiff ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                autoShowDiff ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* 세션 제어 버튼 */}
          <div className="flex space-x-2">
            {!currentSession?.isActive ? (
              <button
                onClick={handleStartSession}
                disabled={isStarting}
                className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-colors"
              >
                {isStarting ? 'Starting...' : 'Start Watching'}
              </button>
            ) : (
              <button
                onClick={handleStopSession}
                className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                Stop Watching
              </button>
            )}
          </div>

          {/* 도움말 */}
          {currentSession?.isActive && (
            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <h4 className="text-sm font-medium text-blue-300 mb-2">🚀 Active Monitoring</h4>
              <ul className="text-xs text-blue-200 space-y-1">
                <li>• File changes are automatically detected</li>
                <li>• Diff view refreshes when Claude Code completes an iteration</li>
                <li>• Review steps can be created from detected changes</li>
              </ul>
            </div>
          )}

          {!currentSession?.isActive && (
            <div className="mt-4 p-3 bg-gray-700 rounded-lg">
              <h4 className="text-sm font-medium text-gray-300 mb-2">💡 How to use</h4>
              <ol className="text-xs text-gray-400 space-y-1">
                <li>1. Click "Start Watching" to monitor file changes</li>
                <li>2. Use Claude Code to make changes to your project</li>
                <li>3. This tool will automatically refresh when changes are detected</li>
                <li>4. Create review steps for systematic code review</li>
              </ol>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          Select a Git repository to enable Claude Code integration
        </div>
      )}
    </div>
  );
};

export default ClaudeCodeIntegration;