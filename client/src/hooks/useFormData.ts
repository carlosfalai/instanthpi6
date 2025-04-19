import { useQuery } from '@tanstack/react-query';
import { formsiteApi, FormSubmissionData } from '@/services/formsiteApi';

export const useFormData = (patientId: number) => {
  // Query for fetching patient form submissions
  const { data: formSubmissions, isLoading } = useQuery({
    queryKey: [`/api/patients/${patientId}/formsubmissions`],
    enabled: !isNaN(patientId),
  });
  
  // Query for fetching urgent care form data
  const getUrgentCareForm = useQuery({
    queryKey: ['/api/formsite/submissions', 'urgent_care'],
    enabled: false, // Only fetch when explicitly requested
    queryFn: () => formsiteApi.getFormSubmissionsByType('urgent_care'),
  });
  
  // Query for fetching STD checkup form data
  const getStdCheckupForm = useQuery({
    queryKey: ['/api/formsite/submissions', 'std_checkup'],
    enabled: false, // Only fetch when explicitly requested
    queryFn: () => formsiteApi.getFormSubmissionsByType('std_checkup'),
  });
  
  return {
    formSubmissions,
    isLoading,
    getUrgentCareForm: () => getUrgentCareForm.refetch(),
    getStdCheckupForm: () => getStdCheckupForm.refetch(),
    urgentCareFormData: getUrgentCareForm.data,
    stdCheckupFormData: getStdCheckupForm.data,
  };
};
