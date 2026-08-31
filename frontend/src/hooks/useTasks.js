import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { toast } from 'sonner';

export function useTasks() {
  const queryClient = useQueryClient();

  // Query tasks from MongoDB API with smooth minimum skeleton loading time
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const [response] = await Promise.all([
        api.getTasks(),
        new Promise((resolve) => setTimeout(resolve, 100)) // 100ms minimum display time for Skeleton UI
      ]);


      const tasksList = response.data || response.tasks || (Array.isArray(response) ? response : []);
      return tasksList.map(t => ({
        ...t,
        id: String(t.id || t._id)
      }));
    },
    staleTime: 30000
  });


  // Create Task Mutation
  const createMutation = useMutation({
    mutationFn: (taskData) => api.createTask(taskData),
    onSuccess: (res) => {
      const created = res.data || res.task || res;
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`Task created: "${created.title || 'Task'}"`);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create task');
    }
  });

  // Update Task Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateTask(id, data),
    onSuccess: (res) => {
      const updated = res.data || res.task || res;
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`Task updated: "${updated.title || 'Task'}"`);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update task');
    }
  });

  // Delete Task Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task removed');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete task');
    }
  });

  // Drag-and-drop Optimistic Status Update
  const updateStatus = async (id, newStatus) => {
    const statusLabels = {
      feedback: 'Feedback & Issue',
      progress: 'In Progress',
      testing: 'Testing / QA',
      success: 'QA Success',
      done: 'Done / Deployed',
      done_production: 'Done Production',
      backlog: 'Backlog / Pending'
    };

    const previousTasks = queryClient.getQueryData(['tasks']);
    const targetTask = previousTasks?.find(t => String(t.id || t._id) === String(id));

    // Optimistically update query cache
    queryClient.setQueryData(['tasks'], (old) => {
      if (!old) return [];
      return old.map(t => String(t.id || t._id) === String(id) ? { ...t, status: newStatus } : t);
    });

    try {
      await api.updateTask(id, { status: newStatus });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`Task moved: "${targetTask?.title || 'Task'}" → ${statusLabels[newStatus] || newStatus}`);
    } catch (err) {
      // Rollback on error
      queryClient.setQueryData(['tasks'], previousTasks);
      toast.error('Failed to move task. Reverted changes.');
    }
  };

  return {
    tasks: data || [],
    isLoading,
    isFetching,
    error,
    refetch,

    createTask: createMutation.mutateAsync,
    updateTask: updateMutation.mutateAsync,
    deleteTask: deleteMutation.mutateAsync,
    updateStatus,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}
