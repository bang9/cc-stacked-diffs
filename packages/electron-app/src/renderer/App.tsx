import React from 'react';
import { useGit } from './hooks/useGit';
import { useStore } from './store/useStore';
import { DiffViewer, AppSidebar, Header, ProjectSelector, GitStatus } from '@cc-stacked-diffs/ui';
import '@cc-stacked-diffs/ui/styles';
import WelcomeMessage from './components/WelcomeMessage';
import ReviewStepActions from './components/ReviewStepActions';
import ClaudeCodeIntegration from './components/ClaudeCodeIntegration';

function App() {
  const { currentRepo, selectDirectory, status, isStatusLoading, statusError, diff, getFileDiff } = useGit();
  const { diffSteps, currentStepId, setCurrentStep, selectedFilePath, viewMode, setSelectedFile } = useStore();

  const handleCreateReviewStep = () => {
    // TODO: Implement review step creation logic
  };

  return (
    <div className="flex flex-col h-screen">
      <Header 
        projectSelectorComponent={
          <ProjectSelector 
            currentRepo={currentRepo}
            onSelectProject={selectDirectory}
          />
        }
      />
      <div className="flex flex-1 overflow-hidden">
        {currentRepo ? (
          <>
            <AppSidebar 
              diffSteps={diffSteps}
              currentStepId={currentStepId}
              onStepSelect={setCurrentStep}
              gitStatusComponent={
                <GitStatus
                  status={status}
                  isStatusLoading={isStatusLoading}
                  statusError={statusError}
                  diff={diff}
                  onFileSelect={setSelectedFile}
                  onCreateReviewStep={handleCreateReviewStep}
                />
              }
              reviewStepActionsComponent={
                currentStepId ? <ReviewStepActions stepId={currentStepId} /> : null
              }
              claudeCodeIntegrationComponent={<ClaudeCodeIntegration />}
            />
            <main className="flex-1 overflow-auto">
              <DiffViewer 
                diff={diff}
                isDiffLoading={false}
                currentRepo={currentRepo}
                diffSteps={diffSteps}
                currentStepId={currentStepId}
                selectedFilePath={selectedFilePath}
                viewMode={viewMode}
                getFileDiff={getFileDiff}
              />
            </main>
          </>
        ) : (
          <main className="flex-1 overflow-auto">
            <WelcomeMessage onGetStarted={selectDirectory} />
          </main>
        )}
      </div>
    </div>
  );
}

export default App;