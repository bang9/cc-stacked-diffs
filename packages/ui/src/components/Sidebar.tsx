import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '../lib/utils';

interface DiffStep {
  id: string;
  title: string;
  description: string;
  files: string[];
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  parentId?: string;
}

interface SidebarProps {
  diffSteps?: DiffStep[];
  currentStepId?: string | null;
  onStepSelect?: (stepId: string) => void;
  gitStatusComponent?: React.ReactNode;
  reviewStepActionsComponent?: React.ReactNode;
  claudeCodeIntegrationComponent?: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({
  diffSteps = [],
  currentStepId,
  onStepSelect,
  gitStatusComponent,
  reviewStepActionsComponent,
  claudeCodeIntegrationComponent,
}) => {
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'reviewing':
        return 'secondary';
      default:
        return 'outline';
    }
  };


  return (
    <aside className="w-80 flex-shrink-0 border-r">
      <ScrollArea className="h-screen">
        <div className="p-4 space-y-6">
          {gitStatusComponent}
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                Diff Steps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {diffSteps.length === 0 ? (
                <div className="text-sm text-muted-foreground p-2 text-center">
                  No diff steps created yet
                </div>
              ) : (
                diffSteps.map((step) => (
                  <div key={step.id} className="relative">
                    {/* Stacked indicator */}
                    {step.parentId && (
                      <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-blue-500"></div>
                    )}
                    
                    <Button
                      variant={currentStepId === step.id ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start h-auto p-3",
                        step.parentId && "ml-4"
                      )}
                      onClick={() => onStepSelect?.(step.id)}
                    >
                      <div className="w-full">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {step.parentId && (
                              <div className="w-4 h-4 flex items-center justify-center">
                                <div className="w-2 h-2 border-l-2 border-b-2 border-blue-500"></div>
                              </div>
                            )}
                            <h3 className="font-medium text-left">{step.title}</h3>
                          </div>
                          <Badge variant={getStatusVariant(step.status)} className="text-xs">
                            {step.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground text-left mb-2">{step.description}</p>
                        <div className="text-xs text-muted-foreground flex items-center space-x-2">
                          <span>{step.files.length} files changed</span>
                          {step.parentId && (
                            <>
                              <span>•</span>
                              <span className="text-blue-500">stacked</span>
                            </>
                          )}
                        </div>
                      </div>
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {currentStepId && reviewStepActionsComponent && (
            <>
              <Separator />
              {reviewStepActionsComponent}
            </>
          )}

          {claudeCodeIntegrationComponent && (
            <>
              <Separator />
              {claudeCodeIntegrationComponent}
            </>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
};

export default Sidebar;