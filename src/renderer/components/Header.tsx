import React from 'react';
import ProjectSelector from './ProjectSelector';

const Header: React.FC = () => {
  return (
    <header className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
      <h1 className="text-lg font-semibold">Claude Code Stacked Diffs</h1>
      <ProjectSelector />
    </header>
  );
};

export default Header;