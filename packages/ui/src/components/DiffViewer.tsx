import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

interface GitDiffFile {
  oldPath: string;
  newPath: string;
  additions: number;
  deletions: number;
  hunks: {
    header: string;
    lines: string[];
  }[];
}

interface DiffStep {
  id: string;
  title: string;
  description: string;
  files: string[];
}

interface DiffViewerProps {
  diff?: GitDiffFile[] | null;
  stagedDiff?: GitDiffFile[] | null;
  isDiffLoading?: boolean;
  currentRepo?: string | null;
  diffSteps?: DiffStep[];
  currentStepId?: string | null;
  selectedFilePath?: string | null;
  viewMode?: 'overview' | 'file-diff';
  getFileDiff?: (filePath: string, staged: boolean) => Promise<GitDiffFile[] | null>;
}

const DiffViewer: React.FC<DiffViewerProps> = ({
  diff,
  stagedDiff,
  isDiffLoading,
  currentRepo,
  diffSteps = [],
  currentStepId,
  selectedFilePath,
  viewMode = 'overview',
  getFileDiff,
}) => {
  const [showStaged, setShowStaged] = useState(false);
  const [selectedFile, setSelectedFile] = useState<GitDiffFile | null>(null);
  const [stepDiff, setStepDiff] = useState<GitDiffFile[] | null>(null);
  const [singleFileDiff, setSingleFileDiff] = useState<GitDiffFile[] | null>(null);

  const currentStep = diffSteps.find(step => step.id === currentStepId);
  const currentDiff = viewMode === 'file-diff' && singleFileDiff 
    ? singleFileDiff 
    : currentStep ? stepDiff : (showStaged ? stagedDiff : diff);

  // Load diff for current step
  useEffect(() => {
    if (currentStep && getFileDiff) {
      const loadStepDiff = async () => {
        try {
          const stepDiffFiles: GitDiffFile[] = [];
          for (const filePath of currentStep.files) {
            const fileDiff = await getFileDiff(filePath, false);
            if (fileDiff && fileDiff.length > 0) {
              stepDiffFiles.push(...fileDiff);
            }
          }
          setStepDiff(stepDiffFiles);
        } catch (error) {
          console.error('Failed to load step diff:', error);
          setStepDiff([]);
        }
      };
      loadStepDiff();
    } else {
      setStepDiff(null);
    }
  }, [currentStep, getFileDiff]);

  // Load diff for selected file
  useEffect(() => {
    if (selectedFilePath && viewMode === 'file-diff' && getFileDiff) {
      const loadSingleFileDiff = async () => {
        try {
          const fileDiff = await getFileDiff(selectedFilePath, false);
          setSingleFileDiff(fileDiff);
        } catch (error) {
          console.error('Failed to load file diff:', error);
          setSingleFileDiff([]);
        }
      };
      loadSingleFileDiff();
    } else {
      setSingleFileDiff(null);
    }
  }, [selectedFilePath, viewMode, getFileDiff]);

  // Auto-select first file
  useEffect(() => {
    if (!selectedFile && currentDiff && currentDiff.length > 0) {
      setSelectedFile(currentDiff[0]);
    }
  }, [currentDiff, selectedFile]);

  if (!currentRepo) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center">
          <p className="text-muted-foreground">Select a Git repository to view changes</p>
        </CardContent>
      </Card>
    );
  }

  if (isDiffLoading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center">
          <p className="text-muted-foreground">Loading diff...</p>
        </CardContent>
      </Card>
    );
  }

  if (!currentDiff || currentDiff.length === 0) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center space-y-2">
          <p className="text-muted-foreground text-lg">No changes to display</p>
          <p className="text-muted-foreground text-sm">Make some changes to your code to see them here</p>
        </CardContent>
      </Card>
    );
  }

  const renderDiffLine = (line: string, index: number) => {
    let className = 'font-mono text-sm whitespace-pre px-4 py-1 border-l-4';
    
    if (line.startsWith('+') && !line.startsWith('+++')) {
      className += ' bg-green-500/10 border-green-500 text-green-400';
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      className += ' bg-red-500/10 border-red-500 text-red-400';
    } else if (line.startsWith('@@')) {
      className += ' bg-blue-500/10 border-blue-500 text-blue-400';
    } else {
      className += ' border-transparent text-muted-foreground';
    }

    return (
      <div key={index} className={className}>
        <span className="select-none text-muted-foreground mr-4 w-8 inline-block text-right">
          {index + 1}
        </span>
        <span>{line}</span>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {viewMode === 'file-diff' && selectedFilePath
                ? `File: ${selectedFilePath.split('/').pop()}`
                : currentStep 
                ? `Review Step: ${currentStep.title}` 
                : 'Changes Overview'
              }
            </CardTitle>
            {viewMode === 'file-diff' && selectedFilePath ? (
              <p className="text-sm text-muted-foreground mt-1 font-mono">{selectedFilePath}</p>
            ) : currentStep ? (
              <p className="text-sm text-muted-foreground mt-1">{currentStep.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">
                Select a file from the sidebar or create a review step
              </p>
            )}
          </div>
          {!currentStep && viewMode === 'overview' && (
            <Tabs value={showStaged ? 'staged' : 'working'} onValueChange={(value) => setShowStaged(value === 'staged')}>
              <TabsList>
                <TabsTrigger value="working">Working Tree</TabsTrigger>
                <TabsTrigger value="staged">Staged</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </CardHeader>

      <div className="flex-1 flex">
        {/* File list */}
        <Card className="w-80 flex-shrink-0 rounded-none border-r border-l-0 border-t-0 border-b-0">
          <CardHeader>
            <CardTitle className="text-sm flex items-center">
              📁 Changed Files ({currentDiff.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-0">
            <ScrollArea className="h-64">
              <div className="p-4 space-y-1">
                {currentDiff.map((file, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedFile === file 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'hover:bg-accent/50'
                }`}
                onClick={() => setSelectedFile(file)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`font-mono text-sm truncate ${
                    selectedFile === file ? 'text-primary-foreground font-medium' : 'text-foreground'
                  }`}>
                    {file.newPath.split('/').pop()}
                  </div>
                  <div className="flex items-center space-x-1">
                    {file.additions > 0 && (
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-xs">
                        +{file.additions}
                      </Badge>
                    )}
                    {file.deletions > 0 && (
                      <Badge variant="secondary" className="bg-red-500/20 text-red-400 text-xs">
                        -{file.deletions}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className={`text-xs truncate ${
                  selectedFile === file ? 'text-primary-foreground/80' : 'text-muted-foreground'
                }`}>
                  {file.newPath}
                </div>
              </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Diff content */}
        <div className="flex-1">
          <ScrollArea className="h-screen">
          {selectedFile ? (
            <div className="h-full">
              {/* File header */}
              <Card className="sticky top-0 z-10 rounded-none border-l-0 border-r-0 border-t-0">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-mono">
                        {selectedFile.newPath.split('/').pop()}
                      </CardTitle>
                      <p className="font-mono text-sm text-muted-foreground mt-1">
                        {selectedFile.newPath}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-green-500 text-white">
                          +{selectedFile.additions}
                        </Badge>
                        <Badge className="bg-red-500 text-white">
                          -{selectedFile.deletions}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedFile.hunks.length} hunk{selectedFile.hunks.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Diff content */}
              <div className="p-4 space-y-6">
                {selectedFile.hunks.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-muted-foreground">No changes to display</p>
                    </CardContent>
                  </Card>
                ) : (
                  selectedFile.hunks.map((hunk, hunkIndex) => (
                    <Card key={hunkIndex}>
                      <CardHeader className="py-2">
                        <code className="text-blue-400 text-sm font-mono">
                          {hunk.header}
                        </code>
                      </CardHeader>
                      <CardContent className="p-0">
                        {hunk.lines.map((line, lineIndex) => renderDiffLine(line, lineIndex))}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ) : (
            <Card className="h-full flex items-center justify-center rounded-none border-l-0 border-r-0 border-t-0 border-b-0">
              <CardContent className="text-center">
                <div className="text-6xl mb-4">📄</div>
                <p className="text-muted-foreground text-lg">Select a file to view changes</p>
                <p className="text-muted-foreground text-sm mt-2">Click on a file from the list to see its diff</p>
              </CardContent>
            </Card>
          )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default DiffViewer;