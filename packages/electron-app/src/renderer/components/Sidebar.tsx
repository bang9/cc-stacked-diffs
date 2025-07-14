import React from 'react';
import { useStore } from '../store/useStore';
import GitStatus from './GitStatus';
import ReviewStepActions from './ReviewStepActions';
import ClaudeCodeIntegration from './ClaudeCodeIntegration';

const Sidebar: React.FC = () => {
  const { diffSteps, currentStepId, setCurrentStep } = useStore();

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
    <aside className="w-96 bg-gray-800 border-r border-gray-700 overflow-y-auto">
      <div className="p-4 space-y-6">
        <GitStatus />
        
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Diff Steps
          </h2>
          <div className="space-y-2">
            {diffSteps.length === 0 ? (
              <div className="text-sm text-gray-500 p-2">
                No diff steps created yet
              </div>
            ) : (
              diffSteps.map((step) => (
                <div key={step.id} className="relative">
                  {/* Stacked indicator */}
                  {step.parentId && (
                    <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-blue-500"></div>
                  )}
                  
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      step.parentId ? 'ml-4' : ''
                    } ${
                      currentStepId === step.id
                        ? 'bg-gray-700'
                        : 'hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {step.parentId && (
                          <div className="w-4 h-4 flex items-center justify-center">
                            <div className="w-2 h-2 border-l-2 border-b-2 border-blue-500"></div>
                          </div>
                        )}
                        <h3 className="font-medium">{step.title}</h3>
                      </div>
                      <span className={`text-xs ${getStatusColor(step.status)}`}>
                        {step.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{step.description}</p>
                    <div className="text-xs text-gray-500 mt-2">
                      {step.files.length} files changed
                      {step.parentId && (
                        <span className="ml-2 text-blue-400">• stacked</span>
                      )}
                    </div>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {currentStepId && (
          <ReviewStepActions stepId={currentStepId} />
        )}
      </div>
    </aside>
  );
};

export default Sidebar;