import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ConfirmDialog from "@/components/ConfirmDialog";

describe("ConfirmDialog", () => {
  const defaultProps = {
    message: "Are you sure you want to delete this action?",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    open: true,
  };

  it("renders nothing when open is false", () => {
    const { container } = render(
      <ConfirmDialog {...defaultProps} open={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the message when open", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(
      screen.getByText("Are you sure you want to delete this action?")
    ).toBeInTheDocument();
  });

  it("has role=dialog and aria-modal=true", () => {
    render(<ConfirmDialog {...defaultProps} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("renders Cancel and Confirm buttons", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
  });

  it("calls onConfirm when Confirm is clicked", () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByText("Confirm"));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onCancel when backdrop is clicked", () => {
    const onCancel = vi.fn();
    const { container } = render(
      <ConfirmDialog {...defaultProps} onCancel={onCancel} />
    );
    // Click the backdrop (outermost fixed overlay)
    const backdrop = container.firstElementChild as HTMLElement;
    fireEvent.click(backdrop);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("does not call onCancel when dialog card is clicked", () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("dialog"));
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("calls onCancel when Escape key is pressed", () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("applies destructive red styling to the Confirm button", () => {
    render(<ConfirmDialog {...defaultProps} />);
    const confirmBtn = screen.getByText("Confirm");
    expect(confirmBtn.className).toContain("bg-red-500");
  });
});
