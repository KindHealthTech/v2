import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: (failureCount, error) => 
        failureCount < 2 && !error.message.includes('404'),
      refetchOnWindowFocus: false
    }
  }
});