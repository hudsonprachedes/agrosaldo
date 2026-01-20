import { QueryClient } from '@tanstack/react-query';

const DEFAULT_STALE_TIME_MS = 60 * 1000;
const DEFAULT_GC_TIME_MS = 24 * 60 * 60 * 1000;

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME_MS,
        gcTime: DEFAULT_GC_TIME_MS,
        retry: (failureCount, error) => {
          const anyError = error as any;
          const status = anyError?.response?.status;

          if (status === 401 || status === 403) {
            return false;
          }

          return failureCount < 2;
        },
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
