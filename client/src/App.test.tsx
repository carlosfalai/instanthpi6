import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

// Mock wouter router
vi.mock("wouter", () => ({
  Router: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: ({ path, component: Component }: { path: string; component: React.ComponentType }) => {
    if (path === "/") {
      return <Component />;
    }
    return null;
  },
  Switch: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useLocation: () => ["/", vi.fn()],
}));

// Mock components
vi.mock("@/components/auth/LoginPage", () => ({
  LoginPage: () => <div>Login Page</div>,
}));

vi.mock("@/pages/doctor-dashboard", () => ({
  default: () => <div>Doctor Dashboard</div>,
}));

vi.mock("@/pages/doctor-login", () => ({
  default: () => <div>Doctor Login</div>,
}));

vi.mock("@/pages/public-patient-intake", () => ({
  default: () => <div>Patient Intake</div>,
}));

describe("App", () => {
  it("renders without crashing", () => {
    render(<App />);
    expect(screen.getByText("Patient Intake")).toBeInTheDocument();
  });
});
