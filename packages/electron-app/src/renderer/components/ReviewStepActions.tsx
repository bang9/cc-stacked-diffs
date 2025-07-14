import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useGit } from '../hooks/useGit';

interface ReviewStepActionsProps {
  stepId: string;
}

const ReviewStepActions: React.FC<ReviewStepActionsProps> = ({ stepId }) => {
  const { diffSteps, updateStepStatus, canApproveStep, getChildrenSteps } = useStore();
  const { stageFile, unstageFile, refreshAll } = useGit();
  const [isProcessing, setIsProcessing] = useState(false);
  const [comment, setComment] = useState('');

  const currentStep = diffSteps.find(step => step.id === stepId);
  const canApprove = canApproveStep(stepId);
  const childrenSteps = getChildrenSteps(stepId);
  const hasChildren = childrenSteps.length > 0;

  if (!currentStep) return null;

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      // Stage all files in this step
      for (const filePath of currentStep.files) {
        await stageFile(filePath);
      }
      
      updateStepStatus(stepId, 'approved');
      refreshAll();
    } catch (error) {
      console.error('Failed to approve step:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = () => {
    updateStepStatus(stepId, 'rejected');
  };

  const handleStartReview = () => {
    updateStepStatus(stepId, 'reviewing');
  };

  const handleReset = () => {
    updateStepStatus(stepId, 'pending');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-400';
      case 'rejected':
        return 'text-red-400';
      case 'reviewing':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="border-t border-gray-700 p-4 bg-gray-800/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Status:</span>
          <span className={`text-sm font-semibold ${getStatusColor(currentStep.status)}`}>
            {currentStep.status.toUpperCase()}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {currentStep.status === 'pending' && (
            <button
              onClick={handleStartReview}
              className="px-3 py-1 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
            >
              Start Review
            </button>
          )}
          
          {currentStep.status === 'reviewing' && (
            <div className="flex space-x-2">
              <button
                onClick={handleApprove}
                disabled={isProcessing || !canApprove}
                className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
                title={!canApprove ? 'Parent step must be approved first' : ''}
              >
                {isProcessing ? 'Processing...' : 'Approve & Stage'}
              </button>
              <button
                onClick={handleReject}
                className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Reject
              </button>
            </div>
          )}
          
          {(currentStep.status === 'approved' || currentStep.status === 'rejected') && (
            <button
              onClick={handleReset}
              className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {currentStep.status === 'reviewing' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Review Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Add your review comments..."
            />
          </div>
        </div>
      )}

      {currentStep.status === 'approved' && (
        <div className="text-sm text-green-400 bg-green-900/20 p-3 rounded">
          ✓ Step approved and files staged for commit
        </div>
      )}

      {currentStep.status === 'rejected' && (
        <div className="text-sm text-red-400 bg-red-900/20 p-3 rounded">
          ✗ Step rejected - changes need to be addressed
        </div>
      )}

      {/* Dependencies info */}
      {(currentStep.parentId || hasChildren) && (
        <div className="mt-4 p-3 bg-gray-700/50 rounded">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Dependencies</h4>
          
          {currentStep.parentId && (
            <div className="text-sm text-gray-400 mb-2">
              <span className="text-blue-400">Parent:</span> {
                diffSteps.find(s => s.id === currentStep.parentId)?.title || 'Unknown'
              }
            </div>
          )}
          
          {hasChildren && (
            <div className="text-sm text-gray-400">
              <span className="text-green-400">Children:</span> {childrenSteps.length} step(s)
              <ul className="ml-4 mt-1">
                {childrenSteps.map(child => (
                  <li key={child.id} className="text-xs">
                    • {child.title} ({child.status})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewStepActions;