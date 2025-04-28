import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Loader2, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PseudonymLink, pseudonymMappingService } from '@/services/pseudonymMapping';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

// Form schema for creating a new pseudonym link
const formSchema = z.object({
  pseudonym: z.string().min(3, { message: "Pseudonym must be at least 3 characters" }),
  patientId: z.number({ 
    required_error: "You must select a patient",
    invalid_type_error: "Patient ID must be a number"
  }),
  messageId: z.number().optional()
});

type FormValues = z.infer<typeof formSchema>;

interface Patient {
  id: number;
  name: string;
  [key: string]: any;
}

interface CreatePseudonymLinkProps {
  onSuccess?: (link: PseudonymLink) => void;
  pseudonym?: string;
}

export function CreatePseudonymLink({ onSuccess, pseudonym }: CreatePseudonymLinkProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Load patients for the dropdown
  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
    queryFn: async () => {
      const response = await fetch('/api/patients');
      if (!response.ok) throw new Error('Failed to fetch patients');
      return response.json();
    }
  });

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pseudonym: pseudonym || '',
      patientId: undefined,
      messageId: undefined
    }
  });

  // Create pseudonym link mutation
  const createLinkMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const patient = patients.find(p => p.id === values.patientId);
      if (!patient) throw new Error('Selected patient not found');
      
      return await pseudonymMappingService.createPseudonymLink({
        pseudonym: values.pseudonym,
        patientId: values.patientId,
        patientName: patient.name,
        messageId: values.messageId
      });
    },
    onSuccess: (link) => {
      toast({
        title: 'Link Created',
        description: `Successfully linked ${link.pseudonym} to ${link.patientName}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/pseudonym-links'] });
      
      if (onSuccess) {
        onSuccess(link);
      }
      
      // Close dialog and reset form
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: 'Creation Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    createLinkMutation.mutate(values);
  };

  // Update form values when pseudonym prop changes
  useEffect(() => {
    if (pseudonym) {
      form.setValue('pseudonym', pseudonym);
    }
  }, [pseudonym, form]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default"
          className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 border-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Pseudonym Link
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1A1A1A] border-[#333] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Link2 className="h-5 w-5 mr-2 text-blue-500" />
            Create Patient Pseudonym Link
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Link a patient pseudonym from FormSite to an actual patient in the system
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
            {/* Pseudonym Field */}
            <FormField
              control={form.control}
              name="pseudonym"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pseudonym</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., 847 Ancient Meadows" 
                      {...field} 
                      className="bg-[#252525] border-[#444] text-white"
                    />
                  </FormControl>
                  <FormDescription className="text-gray-500">
                    The pseudonym used by the patient in their FormSite submission
                  </FormDescription>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            {/* Patient Selection */}
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-[#252525] border-[#444] text-white">
                        <SelectValue placeholder="Select a patient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#1E1E1E] border-[#444] text-white">
                      {patients.map((patient) => (
                        <SelectItem 
                          key={patient.id} 
                          value={patient.id.toString()}
                          className="hover:bg-[#333] focus:bg-[#333] cursor-pointer"
                        >
                          {patient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-gray-500">
                    The actual patient this pseudonym belongs to
                  </FormDescription>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            {/* Message ID (Optional) */}
            <FormField
              control={form.control}
              name="messageId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message ID (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="e.g., 12345" 
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? undefined : parseInt(e.target.value);
                        field.onChange(value);
                      }}
                      className="bg-[#252525] border-[#444] text-white"
                    />
                  </FormControl>
                  <FormDescription className="text-gray-500">
                    Optional message ID where the pseudonym was mentioned
                  </FormDescription>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                className="border-[#444] hover:bg-[#333] text-gray-300"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createLinkMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 border-0"
              >
                {createLinkMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Link
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default CreatePseudonymLink;