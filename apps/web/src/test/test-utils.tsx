import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Create a fresh QueryClient for each test
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface WrapperProps {
  children: React.ReactNode;
}

// All providers wrapper
function AllProviders({ children }: WrapperProps): React.JSX.Element {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}

// Custom render function
function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>): RenderResult {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
export { createTestQueryClient };
