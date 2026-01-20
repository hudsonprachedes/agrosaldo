import { ReactNode, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAppQueryClient } from './queryClient';
import { createAppPersister } from './persistor';

export default function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => createAppQueryClient());
  const [persister] = useState(() => createAppPersister());

  if (typeof window === 'undefined' || !persister) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{ persister, buster: 'v1' }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
