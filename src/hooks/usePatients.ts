import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientService, PatientData, PoliType } from '@/services/patientService';

export const usePatients = (sheetName: string, poliType: PoliType) => {
  return useQuery({
    queryKey: ['patients', sheetName, poliType],
    queryFn: () => patientService.getAllPatients(sheetName, poliType),
    // Optional: Keep data fresh for 1 minute
    staleTime: 60 * 1000,
  });
};

export const usePatientMutations = (sheetName: string, poliType: PoliType) => {
  const queryClient = useQueryClient();
  // Query key to invalidate
  const queryKey = ['patients', sheetName, poliType];

  const addMutation = useMutation({
    mutationFn: ({ data, targetSheet }: { data: Omit<PatientData, 'id'>; targetSheet?: string }) => 
      patientService.addPatient(data, targetSheet || sheetName, poliType),
    onSuccess: (_, args) => {
      const actualSheet = args.targetSheet || sheetName;
      // Invalidate the sheet where data was added
      queryClient.invalidateQueries({ queryKey: ['patients', actualSheet, poliType] });
      
      // If added to a different sheet, also invalidate the current view just in case
      if (actualSheet !== sheetName) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Omit<PatientData, 'id'> }) =>
      patientService.updatePatient(id, data, sheetName, poliType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => patientService.deletePatient(id, sheetName, poliType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteBulkMutation = useMutation({
    mutationFn: (ids: number[]) => patientService.deletePatients(ids, sheetName, poliType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return { addMutation, updateMutation, deleteMutation, deleteBulkMutation };
};
