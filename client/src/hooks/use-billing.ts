import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { BillingEntry, InsertBillingEntry } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useBillingEntries() {
  return useQuery<BillingEntry[]>({
    queryKey: ['/api/billing/entries'],
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useBillingMutations() {
  const { toast } = useToast();

  const createBillingEntry = useMutation({
    mutationFn: async (entry: InsertBillingEntry) => {
      const res = await apiRequest('POST', '/api/billing/entries', entry);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing/entries'] });
      toast({
        title: "Billing entry created",
        description: "The billing entry has been successfully created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create billing entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateBillingEntry = useMutation({
    mutationFn: async ({ id, entry }: { id: number; entry: Partial<InsertBillingEntry> }) => {
      const res = await apiRequest('PATCH', `/api/billing/entries/${id}`, entry);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing/entries'] });
      toast({
        title: "Billing entry updated",
        description: "The billing entry has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update billing entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteBillingEntry = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/billing/entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/billing/entries'] });
      toast({
        title: "Billing entry deleted",
        description: "The billing entry has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete billing entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    createBillingEntry,
    updateBillingEntry,
    deleteBillingEntry,
  };
}