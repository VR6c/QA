import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { toast } from 'sonner';

export function useReports() {
  const queryClient = useQueryClient();

  const kpiTargetsQuery = useQuery({
    queryKey: ['kpiTargets'],
    queryFn: async () => {
      const res = await api.getKpiTargets();
      return res.data;
    }
  });

  const reportsHistoryQuery = useQuery({
    queryKey: ['reportsHistory'],
    queryFn: async () => {
      const res = await api.getReports();
      return res.data || [];
    }
  });

  const updateKpiTargetsMutation = useMutation({
    mutationFn: (newTargets) => api.updateKpiTargets(newTargets),
    onSuccess: () => {
      toast.success('Dynamic KPI targets updated successfully');
      queryClient.invalidateQueries({ queryKey: ['kpiTargets'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyReportPreview'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update KPI targets');
    }
  });

  const finalizeReportMutation = useMutation({
    mutationFn: (reportData) => api.finalizeReport(reportData),
    onSuccess: (res) => {
      toast.success('Report finalized and task state locked successfully');
      queryClient.invalidateQueries({ queryKey: ['reportsHistory'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyReportPreview'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to finalize report');
    }
  });

  const unlockTaskMutation = useMutation({
    mutationFn: (taskId) => api.unlockTask(taskId),
    onSuccess: () => {
      toast.success('Task unlocked and released from monthly claim');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyReportPreview'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to unlock task');
    }
  });

  return {
    kpiTargets: kpiTargetsQuery.data,
    isLoadingKpiTargets: kpiTargetsQuery.isLoading,
    reportsHistory: reportsHistoryQuery.data || [],
    isLoadingHistory: reportsHistoryQuery.isLoading,
    updateKpiTargets: updateKpiTargetsMutation.mutateAsync,
    finalizeReport: finalizeReportMutation.mutateAsync,
    unlockTask: unlockTaskMutation.mutateAsync,
    refetchHistory: reportsHistoryQuery.refetch
  };
}
