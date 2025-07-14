import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface ProjectSelectorProps {
  currentRepo?: string | null;
  onSelectProject?: () => void;
  className?: string;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  currentRepo,
  onSelectProject,
  className,
}) => {
  return (
    <div className={cn("flex items-center space-x-4", className)}>
      <Button
        onClick={onSelectProject}
        size="sm"
      >
        Select Project
      </Button>
      
      {currentRepo && (
        <Badge variant="outline" className="text-sm">
          {currentRepo.split('/').pop() || currentRepo}
        </Badge>
      )}
    </div>
  );
};

export default ProjectSelector;