import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import App from "./App";

vi.mock("./auth/AuthContext", async () => {
  const actual = await vi.importActual("./auth/AuthContext");
  return {
    ...actual,
    useAuth: () => ({ user: null, token: null, loading: false, login: vi.fn(), logout: vi.fn() }),
  };
});

describe("App", () => {
  test("renders the login page when not authenticated", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
  });
});
