import React from "react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider } from "@/components/ThemeProvider";

// ── Mocks ───────────────────────────────────────────────────────────────────

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe("Dashboard error handling", () => {
  let DashboardPage: React.ComponentType;

  beforeEach(async () => {
    pushMock.mockClear();
    const mod = await import("@/app/dashboard/page");
    DashboardPage = mod.default;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  function renderDashboard() {
    return render(
      <ThemeProvider>
        <ToastProvider>
          <DashboardPage />
        </ToastProvider>
      </ThemeProvider>
    );
  }

  it("shows service connection banner when fetch returns 502", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "GitHub connection failed" }), {
        status: 502,
      })
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId("service-banner")).toBeInTheDocument();
    });

    // Banner contains the warning text
    const banner = screen.getByTestId("service-banner");
    expect(banner.textContent).toMatch(/Service connection issue/);
  });

  it("dismisses service banner when close button is clicked", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "GitHub connection failed" }), {
        status: 502,
      })
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId("service-banner")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByLabelText("Dismiss service connection banner")
    );

    expect(screen.queryByTestId("service-banner")).not.toBeInTheDocument();
  });

  it("redirects to login on 401 response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    );

    renderDashboard();

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/login");
    });
  });

  it("shows rate limit toast on 429 response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Rate limited" }), { status: 429 })
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Rate limit exceeded/)).toBeInTheDocument();
    });
  });

  it("shows error toast on 500 response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Server error" }), { status: 500 })
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Server error/)).toBeInTheDocument();
    });
  });

  it("shows connection failed toast on network error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(
      new TypeError("Failed to fetch")
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Connection failed/)).toBeInTheDocument();
    });
  });

  it("does not show service banner for non-502 errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Server error" }), { status: 500 })
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Server error/)).toBeInTheDocument();
    });

    expect(screen.queryByTestId("service-banner")).not.toBeInTheDocument();
  });
});
