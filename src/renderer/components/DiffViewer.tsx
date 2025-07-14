import React, { useState, useEffect } from 'react';
import { useGit } from '../hooks/useGit';
import { useStore } from '../store/useStore';
import Editor from '@monaco-editor/react';
import { GitDiffFile } from '@shared/types';

const DiffViewer: React.FC = () => {
  const { diff, stagedDiff, isDiffLoading, currentRepo, getFileDiff } = useGit();
  const { diffSteps, currentStepId } = useStore();
  const [showStaged, setShowStaged] = useState(false);
  const [selectedFile, setSelectedFile] = useState<GitDiffFile | null>(null);
  const [stepDiff, setStepDiff] = useState<GitDiffFile[] | null>(null);

  const currentStep = diffSteps.find(step => step.id === currentStepId);
  const currentDiff = currentStep ? stepDiff : (showStaged ? stagedDiff : diff);

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
        <p className="text-gray-400">No changes to display</p>
      </div>
    );
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
              {currentStep ? `Review Step: ${currentStep.title}` : 'Changes'}
            </h2>
            {currentStep && (
              <p className="text-sm text-gray-400 mt-1">{currentStep.description}</p>
            )}
          </div>
          {!currentStep && (
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
        <div className="w-1/3 border-r border-gray-700 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Changed Files
            </h3>
            <div className="space-y-2">
              {currentDiff.map((file, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-2 rounded hover:bg-gray-700 ${
                    selectedFile === file ? 'bg-gray-700' : ''
                  }`}
                >
                  <div className="font-mono text-sm text-gray-300">
                    {file.newPath}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="text-green-400">+{file.additions}</span>
                    {' '}
                    <span className="text-red-400">-{file.deletions}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Diff content */}
        <div className="flex-1 overflow-y-auto">
          {selectedFile ? (
            <div className="p-4">
              <div className="bg-gray-800 rounded-lg">
                <div className="border-b border-gray-700 p-4">
                  <div className="font-mono text-sm text-gray-300">
                    {selectedFile.newPath}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="text-green-400">+{selectedFile.additions}</span>
                    {' '}
                    <span className="text-red-400">-{selectedFile.deletions}</span>
                  </div>
                </div>
                <div className="p-4">
                  {selectedFile.hunks.map((hunk, hunkIndex) => (
                    <div key={hunkIndex} className="mb-6">
                      <div className="font-mono text-sm text-blue-300 mb-2">
                        {hunk.header}
                      </div>
                      <div className="bg-gray-900 rounded border border-gray-700 p-3">
                        {hunk.lines.map((line, lineIndex) => renderDiffLine(line, lineIndex))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">Select a file to view diff</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiffViewer;