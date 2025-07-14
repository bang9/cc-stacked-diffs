import React, { useState, useEffect } from 'react';
import { useGit } from '../hooks/useGit';
import { useStore } from '../store/useStore';
import Editor from '@monaco-editor/react';
import { GitDiffFile } from '@shared/types';

const DiffViewer: React.FC = () => {
  const { diff, stagedDiff, isDiffLoading, currentRepo, getFileDiff } = useGit();
  const { diffSteps, currentStepId, selectedFilePath, viewMode } = useStore();
  const [showStaged, setShowStaged] = useState(false);
  const [selectedFile, setSelectedFile] = useState<GitDiffFile | null>(null);
  const [stepDiff, setStepDiff] = useState<GitDiffFile[] | null>(null);
  const [singleFileDiff, setSingleFileDiff] = useState<GitDiffFile[] | null>(null);

  const currentStep = diffSteps.find(step => step.id === currentStepId);
  const currentDiff = viewMode === 'file-diff' && singleFileDiff 
    ? singleFileDiff 
    : currentStep ? stepDiff : (showStaged ? stagedDiff : diff);

  // Load diff for current step
  useEffect(() => {
    if (currentStep) {
      const loadStepDiff = async () => {
        try {
          const stepDiffFiles: GitDiffFile[] = [];
          for (const filePath of currentStep.files) {
            const fileDiff = await getFileDiff(filePath, false);
            if (fileDiff && fileDiff.length > 0) {
              stepDiffFiles.push(...fileDiff);
            }
          }
          setStepDiff(stepDiffFiles);
        } catch (error) {
          console.error('Failed to load step diff:', error);
          setStepDiff([]);
        }
      };
      loadStepDiff();
    } else {
      setStepDiff(null);
    }
  }, [currentStep, getFileDiff]);

  // Load diff for selected file
  useEffect(() => {
    if (selectedFilePath && viewMode === 'file-diff') {
      const loadSingleFileDiff = async () => {
        try {
          const fileDiff = await getFileDiff(selectedFilePath, false);
          setSingleFileDiff(fileDiff);
        } catch (error) {
          console.error('Failed to load file diff:', error);
          setSingleFileDiff([]);
        }
      };
      loadSingleFileDiff();
    } else {
      setSingleFileDiff(null);
    }
  }, [selectedFilePath, viewMode, getFileDiff]);

  if (!currentRepo) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Select a Git repository to view changes</p>
      </div>
    );
  }

  if (isDiffLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Loading diff...</p>
      </div>
    );
  }

  if (!currentDiff || currentDiff.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-2">No changes to display</p>
          <p className="text-gray-500 text-sm">Make some changes to your code to see them here</p>
        </div>
      </div>
    );
  }

  // 자동으로 첫 번째 파일 선택
  if (!selectedFile && currentDiff.length > 0) {
    setSelectedFile(currentDiff[0]);
  }

  const renderDiffLine = (line: string, index: number) => {
    let className = 'font-mono text-sm whitespace-pre';
    let prefix = '';
    
    if (line.startsWith('+') && !line.startsWith('+++')) {
      className += ' bg-green-900/30 text-green-300';
      prefix = '+ ';
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      className += ' bg-red-900/30 text-red-300';
      prefix = '- ';
    } else if (line.startsWith('@@')) {
      className += ' bg-blue-900/30 text-blue-300';
    } else {
      className += ' text-gray-300';
      prefix = '  ';
    }

    return (
      <div key={index} className={className}>
        {prefix}{line}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              {viewMode === 'file-diff' && selectedFilePath
                ? `File: ${selectedFilePath.split('/').pop()}`
                : currentStep 
                ? `Review Step: ${currentStep.title}` 
                : 'Changes Overview'
              }
            </h2>
            {viewMode === 'file-diff' && selectedFilePath ? (
              <p className="text-sm text-gray-400 mt-1 font-mono">{selectedFilePath}</p>
            ) : currentStep ? (
              <p className="text-sm text-gray-400 mt-1">{currentStep.description}</p>
            ) : (
              <p className="text-sm text-gray-400 mt-1">
                Select a file from the sidebar or create a review step
              </p>
            )}
          </div>
          {!currentStep && viewMode === 'overview' && (
            <div className="flex space-x-2">
              <button
                onClick={() => setShowStaged(false)}
                className={`px-3 py-1 rounded text-sm ${
                  !showStaged
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Working Tree
              </button>
              <button
                onClick={() => setShowStaged(true)}
                className={`px-3 py-1 rounded text-sm ${
                  showStaged
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Staged
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex">
        {/* File list */}
        <div className="w-1/3 border-r border-gray-700 overflow-y-auto bg-gray-850">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center">
              <span className="mr-2">📁</span>
              Changed Files ({currentDiff.length})
            </h3>
            <div className="space-y-1">
              {currentDiff.map((file, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                    selectedFile === file 
                      ? 'bg-blue-600 border border-blue-500 shadow-lg' 
                      : 'bg-gray-700 hover:bg-gray-600 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`font-mono text-sm truncate ${
                      selectedFile === file ? 'text-white font-medium' : 'text-gray-300'
                    }`}>
                      {file.newPath.split('/').pop()}
                    </div>
                    <div className="flex items-center space-x-1 text-xs">
                      {file.additions > 0 && (
                        <span className="bg-green-600 text-white px-1.5 py-0.5 rounded">
                          +{file.additions}
                        </span>
                      )}
                      {file.deletions > 0 && (
                        <span className="bg-red-600 text-white px-1.5 py-0.5 rounded">
                          -{file.deletions}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`text-xs truncate ${
                    selectedFile === file ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {file.newPath}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Diff content */}
        <div className="flex-1 overflow-y-auto bg-gray-900">
          {selectedFile ? (
            <div className="h-full">
              {/* File header */}
              <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-mono text-lg text-white font-medium">
                      {selectedFile.newPath.split('/').pop()}
                    </h4>
                    <p className="font-mono text-sm text-gray-400 mt-1">
                      {selectedFile.newPath}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="bg-green-600 text-white px-2 py-1 rounded text-sm font-mono">
                        +{selectedFile.additions}
                      </span>
                      <span className="bg-red-600 text-white px-2 py-1 rounded text-sm font-mono">
                        -{selectedFile.deletions}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {selectedFile.hunks.length} hunk{selectedFile.hunks.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Diff content */}
              <div className="p-4 space-y-6">
                {selectedFile.hunks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No changes to display</p>
                  </div>
                ) : (
                  selectedFile.hunks.map((hunk, hunkIndex) => (
                    <div key={hunkIndex} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                      <div className="bg-gray-750 px-4 py-2 border-b border-gray-700">
                        <code className="text-blue-300 text-sm font-mono">
                          {hunk.header}
                        </code>
                      </div>
                      <div className="font-mono text-sm">
                        {hunk.lines.map((line, lineIndex) => (
                          <div key={lineIndex} className={`px-4 py-1 ${
                            line.startsWith('+') && !line.startsWith('+++')
                              ? 'bg-green-900/30 border-l-4 border-green-500'
                              : line.startsWith('-') && !line.startsWith('---')
                              ? 'bg-red-900/30 border-l-4 border-red-500'
                              : line.startsWith('@@')
                              ? 'bg-blue-900/30 text-blue-300'
                              : 'text-gray-300'
                          }`}>
                            <span className="select-none text-gray-500 mr-4 w-8 inline-block text-right">
                              {lineIndex + 1}
                            </span>
                            <span className="whitespace-pre">{line}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">📄</div>
                <p className="text-gray-400 text-lg">Select a file to view changes</p>
                <p className="text-gray-500 text-sm mt-2">Click on a file from the list to see its diff</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiffViewer;