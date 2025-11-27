import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";
import { queryClient } from "@/utils/queryClient";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster position="top-right" richColors closeButton />
        {import.meta.env.DEV && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </AuthProvider>
    </QueryClientProvider>
  );
}
