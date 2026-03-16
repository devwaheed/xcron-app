import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ScriptEditor from "@/components/ScriptEditor";

describe("ScriptEditor", () => {
  const defaultProps = {
    value: "",
    onChange: vi.fn(),
  };

  it("renders a textarea with monospace font", () => {
    render(<ScriptEditor {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(
      "Paste your JavaScript code here…"
    );
    expect(textarea).toBeInTheDocument();
    expect(textarea.className).toContain("font-mono");
  });

  it("displays the provided value in the textarea", () => {
    render(<ScriptEditor {...defaultProps} value='console.log("hi");' />);
    const textarea = screen.getByPlaceholderText(
      "Paste your JavaScript code here…"
    );
    expect(textarea).toHaveValue('console.log("hi");');
  });

  it("calls onChange when text is typed", () => {
    const onChange = vi.fn();
    render(<ScriptEditor {...defaultProps} onChange={onChange} />);
    const textarea = screen.getByPlaceholderText(
      "Paste your JavaScript code here…"
    );
    fireEvent.change(textarea, { target: { value: "const x = 1;" } });
    expect(onChange).toHaveBeenCalledWith("const x = 1;");
  });

  it("renders an upload button", () => {
    render(<ScriptEditor {...defaultProps} />);
    expect(screen.getByText("Upload .js file")).toBeInTheDocument();
  });

  it("has a hidden file input that accepts .js files", () => {
    render(<ScriptEditor {...defaultProps} />);
    const fileInput = screen.getByTestId("file-input") as HTMLInputElement;
    expect(fileInput).toHaveAttribute("accept", ".js");
    expect(fileInput.className).toContain("hidden");
  });

  it("reads uploaded .js file and calls onChange with content", async () => {
    const onChange = vi.fn();
    render(<ScriptEditor {...defaultProps} onChange={onChange} />);

    const fileContent = 'console.log("uploaded");';
    const file = new File([fileContent], "script.js", {
      type: "application/javascript",
    });

    const fileInput = screen.getByTestId("file-input");
    fireEvent.change(fileInput, { target: { files: [file] } });

    // FileReader is async — wait for onChange to be called
    await vi.waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(fileContent);
    });
  });

  it("applies glass-morphism styling to the textarea", () => {
    render(<ScriptEditor {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(
      "Paste your JavaScript code here…"
    );
    expect(textarea.className).toContain("rounded-xl");
    expect(textarea.className).toContain("border");
  });
});
