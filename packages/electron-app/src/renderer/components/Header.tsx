import React from 'react';
import ProjectSelector from './ProjectSelector';

const Header: React.FC = () => {
  return (
    <header className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">CC</span>
        </div>
        <h1 className="text-lg font-semibold">Claude Code Stacked Diffs</h1>
        <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
          Dog Fooding Mode
        </span>
      </div>
      <ProjectSelector />
    </header>
  );
};

export default Header;