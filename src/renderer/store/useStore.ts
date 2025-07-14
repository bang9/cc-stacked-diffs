import { create } from 'zustand';

interface DiffStep {
  id: string;
  title: string;
  description: string;
  files: string[];
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  changes: any[]; // Will be properly typed later
  parentId?: string; // For stacked diffs
  createdAt: number;
  order: number;
}

interface AppState {
  currentProject: string | null;
  diffSteps: DiffStep[];
  currentStepId: string | null;
  setCurrentProject: (project: string) => void;
  addDiffStep: (step: Omit<DiffStep, 'createdAt' | 'order'>) => void;
  updateStepStatus: (stepId: string, status: DiffStep['status']) => void;
  setCurrentStep: (stepId: string | null) => void;
  getStepChain: (stepId: string) => DiffStep[];
  getChildrenSteps: (stepId: string) => DiffStep[];
  canApproveStep: (stepId: string) => boolean;
  reorderSteps: (stepIds: string[]) => void;
  deleteStep: (stepId: string) => void;
}

export const useStore = create<AppState>((set, get) => ({
  currentProject: null,
  diffSteps: [],
  currentStepId: null,
  
  setCurrentProject: (project) => set({ currentProject: project }),
  
  addDiffStep: (step) => set((state) => {
    const now = Date.now();
    const newStep: DiffStep = {
      ...step,
      createdAt: now,
      order: state.diffSteps.length,
    };
    return {
      diffSteps: [...state.diffSteps, newStep].sort((a, b) => a.order - b.order)
    };
  }),
  
  updateStepStatus: (stepId, status) => set((state) => ({
    diffSteps: state.diffSteps.map(step =>
      step.id === stepId ? { ...step, status } : step
    )
  })),
  
  setCurrentStep: (stepId) => set({ currentStepId: stepId }),

  getStepChain: (stepId) => {
    const { diffSteps } = get();
    const chain: DiffStep[] = [];
    let currentStep = diffSteps.find(step => step.id === stepId);
    
    while (currentStep) {
      chain.unshift(currentStep);
      if (currentStep.parentId) {
        currentStep = diffSteps.find(step => step.id === currentStep!.parentId);
      } else {
        break;
      }
    }
    
    return chain;
  },

  getChildrenSteps: (stepId) => {
    const { diffSteps } = get();
    return diffSteps.filter(step => step.parentId === stepId);
  },

  canApproveStep: (stepId) => {
    const { diffSteps } = get();
    const step = diffSteps.find(s => s.id === stepId);
    if (!step) return false;
    
    // If step has a parent, parent must be approved
    if (step.parentId) {
      const parent = diffSteps.find(s => s.id === step.parentId);
      return parent?.status === 'approved';
    }
    
    return true;
  },

  reorderSteps: (stepIds) => set((state) => {
    const reorderedSteps = stepIds.map((id, index) => {
      const step = state.diffSteps.find(s => s.id === id);
      return step ? { ...step, order: index } : null;
    }).filter(Boolean) as DiffStep[];
    
    return {
      diffSteps: reorderedSteps.sort((a, b) => a.order - b.order)
    };
  }),

  deleteStep: (stepId) => set((state) => {
    // Also delete all children
    const toDelete = new Set([stepId]);
    const findChildren = (parentId: string) => {
      state.diffSteps.forEach(step => {
        if (step.parentId === parentId) {
          toDelete.add(step.id);
          findChildren(step.id);
        }
      });
    };
    findChildren(stepId);
    
    return {
      diffSteps: state.diffSteps.filter(step => !toDelete.has(step.id)),
      currentStepId: toDelete.has(state.currentStepId || '') ? null : state.currentStepId
    };
  }),
}));