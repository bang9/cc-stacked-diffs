import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GitStatus, GitDiffFile, GitResponse } from '@shared/types';

export const useGit = () => {
  const [currentRepo, setCurrentRepo] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const initializeRepo = useCallback(async (repoPath: string) => {
    const result = await window.electronAPI.git.initialize(repoPath);
    if (result.success) {
      setCurrentRepo(repoPath);
    }
    return result;
  }, []);

  const selectDirectory = useCallback(async () => {
    const path = await window.electronAPI.selectDirectory();
    if (path) {
      const result = await initializeRepo(path);
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['git'] });
      }
      return result;
    }
    return null;
  }, [initializeRepo, queryClient]);

  const {
    data: status,
    isLoading: isStatusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ['git', 'status'],
    queryFn: async () => {
      const result = await window.electronAPI.git.status();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!currentRepo,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const {
    data: diff,
    isLoading: isDiffLoading,
    error: diffError,
    refetch: refetchDiff,
  } = useQuery({
    queryKey: ['git', 'diff'],
    queryFn: async () => {
      const result = await window.electronAPI.git.diff({ staged: false });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!currentRepo,
  });

  const {
    data: stagedDiff,
    isLoading: isStagedDiffLoading,
    error: stagedDiffError,
    refetch: refetchStagedDiff,
  } = useQuery({
    queryKey: ['git', 'stagedDiff'],
    queryFn: async () => {
      const result = await window.electronAPI.git.diff({ staged: true });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!currentRepo,
  });

  const stageMutation = useMutation({
    mutationFn: async (filePath: string) => {
      const result = await window.electronAPI.git.stage(filePath);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['git'] });
    },
  });

  const unstageMutation = useMutation({
    mutationFn: async (filePath: string) => {
      const result = await window.electronAPI.git.unstage(filePath);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['git'] });
    },
  });

  const getFileDiff = useCallback(
    async (filePath: string, staged: boolean = false) => {
      const result = await window.electronAPI.git.fileDiff(filePath, staged);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    []
  );

  const refreshAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['git'] });
  }, [queryClient]);

  return {
    currentRepo,
    status,
    diff,
    stagedDiff,
    isStatusLoading,
    isDiffLoading,
    isStagedDiffLoading,
    statusError,
    diffError,
    stagedDiffError,
    selectDirectory,
    initializeRepo,
    stageFile: stageMutation.mutate,
    unstageFile: unstageMutation.mutate,
    getFileDiff,
    refreshAll,
    refetchStatus,
    refetchDiff,
    refetchStagedDiff,
  };
};