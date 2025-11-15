import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { api } from "@/api/client";
import type { Doctor } from "@/api/types";
import { useAuth } from "@/contexts/AuthContext";

export function useDoctorProfile() {
  const { user } = useAuth();

  return useQuery<Doctor | null>({
    queryKey: ["doctor", "profile", user?.id],
    enabled: !!user?.id,
    retry: false,
    queryFn: async (): Promise<Doctor | null> => {
      if (!user?.id) {
        return null;
      }

      try {
        // AccountId IS DoctorId - use user.id directly as doctorId
        const response = await api.doctor.getDoctorById(user.id);
        return response.data ?? null;
      } catch (error: any) {
        if (isAxiosError(error) && error.response?.status === 404) {
          // Don't show warning toast - 404 is expected if account is not a doctor
          return null;
        }

        const message =
          error?.response?.data?.message || "Unable to load doctor profile.";
        toast.error(message);
        throw error;
      }
    },
  });
}
