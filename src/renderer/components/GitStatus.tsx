import React, { useState } from 'react';
import { useGit } from '../hooks/useGit';
import ReviewWorkflow from './ReviewWorkflow';

const GitStatus: React.FC = () => {
  const { status, isStatusLoading, statusError, diff } = useGit();
  const [showReviewWorkflow, setShowReviewWorkflow] = useState(false);

  if (isStatusLoading) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg">
        <div className="text-sm text-gray-400">Loading git status...</div>
      </div>
    );
  }

  if (statusError) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg">
        <div className="text-sm text-red-400">Error loading git status: {statusError.message}</div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg">
        <div className="text-sm text-gray-400">No git repository selected</div>
      </div>
    );
  }

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'staged':
        return 'text-green-400';
      case 'modified':
        return 'text-yellow-400';
      case 'created':
        return 'text-blue-400';
      case 'deleted':
        return 'text-red-400';
      case 'conflicted':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  const renderFileList = (files: string[], type: string, label: string) => {
    if (files.length === 0) return null;

    return (
      <div className="mb-2">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          {label} ({files.length})
        </div>
        <div className="space-y-1">
          {files.map((file, index) => (
            <div key={index} className={`text-sm ${getStatusColor(type)}`}>
              {file}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="p-4 bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Git Status
          </h3>
          <div className="text-xs text-gray-500">
            Branch: {status.current}
          </div>
        </div>

        {status.isClean ? (
          <div className="text-sm text-green-400">Working tree clean</div>
        ) : (
          <div className="space-y-3">
            {renderFileList(status.staged, 'staged', 'Staged')}
            {renderFileList(status.modified, 'modified', 'Modified')}
            {renderFileList(status.created, 'created', 'Created')}
            {renderFileList(status.deleted, 'deleted', 'Deleted')}
            {renderFileList(status.not_added, 'not_added', 'Untracked')}
            {renderFileList(status.conflicted, 'conflicted', 'Conflicted')}
          </div>
        )}

        {!status.isClean && diff && diff.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <button
              onClick={() => setShowReviewWorkflow(true)}
              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              Create Review Step
            </button>
          </div>
        )}
      </div>

      {showReviewWorkflow && (
        <ReviewWorkflow onClose={() => setShowReviewWorkflow(false)} />
      )}
    </>
  );
};

export default GitStatus;