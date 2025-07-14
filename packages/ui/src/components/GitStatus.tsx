import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { cn } from '../lib/utils';

interface GitStatusData {
  current: string;
  isClean: boolean;
  staged: string[];
  modified: string[];
  created: string[];
  deleted: string[];
  not_added: string[];
  conflicted: string[];
}

interface GitStatusProps {
  status?: GitStatusData | null;
  isStatusLoading?: boolean;
  statusError?: Error | null;
  diff?: any[] | null;
  onFileSelect?: (file: string) => void;
  onCreateReviewStep?: () => void;
}

const GitStatus: React.FC<GitStatusProps> = ({
  status,
  isStatusLoading,
  statusError,
  diff,
  onFileSelect,
  onCreateReviewStep,
}) => {
  if (isStatusLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">Loading git status...</div>
        </CardContent>
      </Card>
    );
  }

  if (statusError) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-4">
          <div className="text-sm text-destructive">Error loading git status: {statusError.message}</div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">No git repository selected</div>
        </CardContent>
      </Card>
    );
  }


  const getStatusColor = (type: string) => {
    switch (type) {
      case 'staged':
        return 'bg-green-500';
      case 'modified':
        return 'bg-yellow-500';
      case 'created':
        return 'bg-blue-500';
      case 'deleted':
        return 'bg-red-500';
      case 'conflicted':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const renderFileList = (files: string[], type: string, label: string) => {
    if (files.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </h4>
          <Badge variant="outline" className="text-xs">
            {files.length}
          </Badge>
        </div>
        <div className="space-y-0.5">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent/50 cursor-pointer transition-colors group"
              onClick={() => onFileSelect?.(file)}
            >
              <div className={cn("w-2 h-2 rounded-full flex-shrink-0", getStatusColor(type))} />
              <span className="font-mono text-sm truncate text-muted-foreground group-hover:text-foreground transition-colors">
                {file}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider">
            Git Status
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <div className="text-xs text-muted-foreground">
              Branch: {status.current}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {status.isClean ? (
          <div className="text-sm text-green-500 flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Working tree clean</span>
          </div>
        ) : (
          <div className="space-y-4">
            {renderFileList(status.staged, 'staged', 'Staged')}
            {renderFileList(status.modified, 'modified', 'Modified')}
            {renderFileList(status.created, 'created', 'Created')}
            {renderFileList(status.deleted, 'deleted', 'Deleted')}
            {renderFileList(status.not_added, 'not_added', 'Untracked')}
            {renderFileList(status.conflicted, 'conflicted', 'Conflicted')}
          </div>
        )}

        {!status.isClean && diff && diff.length > 0 && (
          <>
            <Separator />
            <Button
              onClick={onCreateReviewStep}
              className="w-full"
              size="sm"
            >
              Create Review Step
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GitStatus;