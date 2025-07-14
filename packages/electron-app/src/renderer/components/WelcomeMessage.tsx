import React from 'react';

interface WelcomeMessageProps {
  onGetStarted: () => void;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ onGetStarted }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="max-w-md">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-bold text-2xl">CC</span>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-100 mb-4">
          Welcome to Claude Code Stacked Diffs!
        </h2>
        
        <p className="text-gray-400 mb-6 leading-relaxed">
          Review your AI-generated code changes systematically with our stacked diffs workflow. 
          Break down large changes into manageable review steps and ensure code quality.
        </p>

        <div className="space-y-4 text-left text-sm text-gray-500">
          <div className="flex items-start space-x-3">
            <span className="text-blue-400">1.</span>
            <span>Select a Git repository to start reviewing changes</span>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-blue-400">2.</span>
            <span>Create review steps to organize your changes</span>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-blue-400">3.</span>
            <span>Review, approve, and stage changes systematically</span>
          </div>
        </div>

        <button
          onClick={onGetStarted}
          className="mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Select Project to Get Started
        </button>
      </div>
    </div>
  );
};

export default WelcomeMessage;