import React, { useState } from 'react';
import { useGit } from '../hooks/useGit';
import { useStore } from '../store/useStore';
import { GitDiffFile } from '@shared/types';

interface ReviewWorkflowProps {
  onClose: () => void;
}

const ReviewWorkflow: React.FC<ReviewWorkflowProps> = ({ onClose }) => {
  const { diff, stageFile, unstageFile, refreshAll } = useGit();
  const { addDiffStep, diffSteps } = useStore();
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [stepTitle, setStepTitle] = useState('');
  const [stepDescription, setStepDescription] = useState('');
  const [parentStepId, setParentStepId] = useState<string>('');

  const handleFileToggle = (filePath: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(filePath)) {
      newSelection.delete(filePath);
    } else {
      newSelection.add(filePath);
    }
    setSelectedFiles(newSelection);
  };

  const handleStageSelected = async () => {
    try {
      for (const filePath of selectedFiles) {
        await stageFile(filePath);
      }
      refreshAll();
      setSelectedFiles(new Set());
    } catch (error) {
      console.error('Failed to stage files:', error);
    }
  };

  const handleCreateStep = () => {
    if (!stepTitle.trim()) return;

    const newStep = {
      id: Date.now().toString(),
      title: stepTitle,
      description: stepDescription,
      files: Array.from(selectedFiles),
      status: 'pending' as const,
      changes: [], // Will be populated with actual diff data
      parentId: parentStepId || undefined,
    };

    addDiffStep(newStep);
    
    // Reset form
    setStepTitle('');
    setStepDescription('');
    setSelectedFiles(new Set());
    setParentStepId('');
    onClose();
  };

  const handleSelectAll = () => {
    if (!diff) return;
    
    if (selectedFiles.size === diff.length) {
      setSelectedFiles(new Set());
    } else {
      const allFiles = new Set(diff.map(file => file.newPath));
      setSelectedFiles(allFiles);
    }
  };

  if (!diff || diff.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-lg font-semibold mb-4">No Changes</h2>
          <p className="text-gray-400 mb-4">
            There are no changes to create a review step from.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Create Review Step</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Step info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Step Title
              </label>
              <input
                type="text"
                value={stepTitle}
                onChange={(e) => setStepTitle(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter step title..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={stepDescription}
                onChange={(e) => setStepDescription(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe what this step accomplishes..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Parent Step (for stacked diffs)
              </label>
              <select
                value={parentStepId}
                onChange={(e) => setParentStepId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No parent (base step)</option>
                {diffSteps
                  .filter(step => step.status === 'approved')
                  .map(step => (
                    <option key={step.id} value={step.id}>
                      {step.title}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select a parent step to create a stacked diff. Only approved steps can be parents.
              </p>
            </div>
          </div>

          {/* File selection */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Select Files</h3>
              <div className="flex space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded text-white"
                >
                  {selectedFiles.size === diff.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={handleStageSelected}
                  disabled={selectedFiles.size === 0}
                  className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white"
                >
                  Stage Selected ({selectedFiles.size})
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {diff.map((file) => (
                <div
                  key={file.newPath}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedFiles.has(file.newPath)
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onClick={() => handleFileToggle(file.newPath)}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(file.newPath)}
                      onChange={() => handleFileToggle(file.newPath)}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-mono text-sm text-gray-300">
                        {file.newPath}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        <span className="text-green-400">+{file.additions}</span>
                        {' '}
                        <span className="text-red-400">-{file.deletions}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateStep}
              disabled={!stepTitle.trim() || selectedFiles.size === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white"
            >
              Create Step
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewWorkflow;