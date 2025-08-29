import "@testing-library/jest-dom";

// Mock environment variables for tests
Object.defineProperty(import.meta, "env", {
  value: {
    VITE_SUPABASE_URL: "https://test-supabase-url.supabase.co",
    VITE_SUPABASE_ANON_KEY: "test-supabase-anon-key",
  },
  writable: true,
});

// Mock Supabase client for tests
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(),
      getUser: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(),
        order: vi.fn(),
        limit: vi.fn(),
      })),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
  },
}));
