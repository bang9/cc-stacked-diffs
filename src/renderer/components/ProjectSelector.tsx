import React from 'react';
import { useGit } from '../hooks/useGit';

const ProjectSelector: React.FC = () => {
  const { currentRepo, selectDirectory } = useGit();

  const handleSelectProject = async () => {
    try {
      await selectDirectory();
    } catch (error) {
      console.error('Failed to select project:', error);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={handleSelectProject}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
      >
        Select Project
      </button>
      
      {currentRepo && (
        <span className="text-sm text-gray-400">
          {currentRepo.split('/').pop() || currentRepo}
        </span>
      )}
    </div>
  );
};

export default ProjectSelector;