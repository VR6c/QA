import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { toast } from 'sonner';

export const DEFAULT_OWNERS_FALLBACK = [
  { id: '1', name: 'Unassigned', role: 'General', color: 'slate', isDefault: true },
  { id: '2', name: 'Vireak', role: 'QA Lead', color: 'indigo', isDefault: true },
  { id: '3', name: 'QA Team', role: 'QA Tester', color: 'blue', isDefault: true },
  { id: '4', name: 'Dev Team', role: 'Developer', color: 'emerald', isDefault: true },
  { id: '5', name: 'Product Manager', role: 'Product Owner', color: 'purple', isDefault: true }
];

export function useOwners() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['owners'],
    queryFn: async () => {
      try {
        const response = await api.getOwners();
        const ownerList = response.data || response.owners || (Array.isArray(response) ? response : []);
        return ownerList && ownerList.length > 0 ? ownerList : DEFAULT_OWNERS_FALLBACK;
      } catch (err) {
        console.warn('Backend owners API error, using fallback options', err);
        return DEFAULT_OWNERS_FALLBACK;
      }
    },
    staleTime: 60000
  });

  const createMutation = useMutation({
    mutationFn: (ownerData) => api.createOwner(ownerData),
    onSuccess: (res) => {
      const created = res.data || res.owner || res;
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      toast.success(`Owner created: "${created?.name || 'Owner'}"`);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to create owner');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateOwner(id, data),
    onSuccess: (res) => {
      const updated = res.data || res.owner || res;
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`Owner updated: "${updated?.name || 'Owner'}"`);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update owner');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteOwner(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Owner deleted');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete owner');
    }
  });

  return {
    owners: data || DEFAULT_OWNERS_FALLBACK,
    isLoading,
    error,
    refetch,
    createOwner: createMutation.mutateAsync,
    updateOwner: updateMutation.mutateAsync,
    deleteOwner: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}
