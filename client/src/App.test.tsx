import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";

// Mock wouter router
vi.mock("wouter", () => ({
  Router: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: ({ children, component: Component }: { children?: React.ReactNode; path: string; component?: React.ComponentType }) => {
    if (Component) {
      return <Component />;
    }
    return <div>{children}</div>;
  },
  Switch: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useLocation: () => ["/", vi.fn()],
  Redirect: () => null,
}));

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}));

// Mock components
vi.mock("@/pages/doctor-login", () => ({
  default: () => <div>Doctor Login</div>,
}));

vi.mock("@/pages/auth-callback", () => ({
  default: () => <div>Auth Callback</div>,
}));

vi.mock("@/pages/command-center", () => ({
  default: () => <div data-testid="command-center">Command Center</div>,
}));

vi.mock("@/pages/settings-page", () => ({
  default: () => <div>Settings Page</div>,
}));

vi.mock("@/lib/auth-guard", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("App", () => {
  it("renders without crashing", async () => {
    render(<App />);
    // Wait for lazy-loaded component to appear
    await waitFor(() => {
      expect(screen.getByTestId("command-center")).toBeInTheDocument();
    });
  });
});
