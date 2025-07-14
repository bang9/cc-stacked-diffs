import React from 'react';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

interface HeaderProps {
  title?: string;
  projectSelectorComponent?: React.ReactNode;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({
  title = "Claude Code Stacked Diffs",
  projectSelectorComponent,
  className,
}) => {
  return (
    <header className={cn(
      "h-14 border-b flex items-center justify-between px-4",
      className
    )}>
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">CC</span>
        </div>
        <h1 className="text-lg font-semibold">{title}</h1>
        <Badge variant="default" className="bg-green-600 hover:bg-green-600">
          Dog Fooding Mode
        </Badge>
      </div>
      {projectSelectorComponent}
    </header>
  );
};

export default Header;