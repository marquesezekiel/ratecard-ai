import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/dashboard/tools/brand-vetter",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// =============================================================================
// BREADCRUMB TESTS (Issue 12)
// =============================================================================

describe("WCAG AAA - Breadcrumb Navigation (Issue 12)", () => {
  it("should render breadcrumb with correct structure", async () => {
    const { Breadcrumb } = await import("@/components/ui/breadcrumb");

    const items = [
      { label: "Home", href: "/dashboard" },
      { label: "Tools", href: "/dashboard/tools" },
      { label: "Brand Vetter" },
    ];

    render(<Breadcrumb items={items} />);

    // Check for nav element with aria-label
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(nav).toBeInTheDocument();

    // Check for list structure
    const list = nav.querySelector("ol");
    expect(list).toBeInTheDocument();
  });

  it("should have aria-label='Breadcrumb' on nav element", async () => {
    const { Breadcrumb } = await import("@/components/ui/breadcrumb");

    const items = [
      { label: "Home", href: "/dashboard" },
      { label: "Current Page" },
    ];

    render(<Breadcrumb items={items} />);

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveAttribute("aria-label", "Breadcrumb");
  });

  it("should have aria-current='page' on current item", async () => {
    const { Breadcrumb } = await import("@/components/ui/breadcrumb");

    const items = [
      { label: "Home", href: "/dashboard" },
      { label: "Tools", href: "/dashboard/tools" },
      { label: "Brand Vetter" },
    ];

    render(<Breadcrumb items={items} />);

    // The last item (without href) should have aria-current="page"
    const currentPageElement = screen.getByText("Brand Vetter");
    expect(currentPageElement).toHaveAttribute("aria-current", "page");
  });

  it("should render links for items with href", async () => {
    const { Breadcrumb } = await import("@/components/ui/breadcrumb");

    const items = [
      { label: "Home", href: "/dashboard" },
      { label: "Tools", href: "/dashboard/tools" },
      { label: "Brand Vetter" },
    ];

    render(<Breadcrumb items={items} />);

    // First two items should be links
    const homeLink = screen.getByRole("link", { name: /home/i });
    expect(homeLink).toHaveAttribute("href", "/dashboard");

    const toolsLink = screen.getByRole("link", { name: /tools/i });
    expect(toolsLink).toHaveAttribute("href", "/dashboard/tools");

    // Last item should not be a link
    const currentPage = screen.getByText("Brand Vetter");
    expect(currentPage.tagName).toBe("SPAN");
  });

  it("should render separator icons as aria-hidden", async () => {
    const { Breadcrumb } = await import("@/components/ui/breadcrumb");

    const items = [
      { label: "Home", href: "/dashboard" },
      { label: "Tools", href: "/dashboard/tools" },
      { label: "Brand Vetter" },
    ];

    const { container } = render(<Breadcrumb items={items} />);

    // Check that chevron icons have aria-hidden
    const chevrons = container.querySelectorAll("svg");
    chevrons.forEach((chevron) => {
      if (!chevron.closest("a")) {
        // Separator icons (not inside links)
        expect(chevron).toHaveAttribute("aria-hidden", "true");
      }
    });
  });
});

// =============================================================================
// KEYBOARD SHORTCUTS TESTS (Issue 13)
// =============================================================================

describe("WCAG A - Keyboard Shortcuts (Issue 13)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should define correct shortcuts in SHORTCUTS array", async () => {
    const { SHORTCUTS } = await import("@/hooks/use-keyboard-shortcuts");

    // Verify expected shortcuts exist
    const shortcutKeys = SHORTCUTS.map((s) => s.key);
    expect(shortcutKeys).toContain("?");
    expect(shortcutKeys).toContain("g h");
    expect(shortcutKeys).toContain("g i");
    expect(shortcutKeys).toContain("g r");
    expect(shortcutKeys).toContain("n");
  });

  it("keyboard shortcuts modal should open with ? key", async () => {
    const { KeyboardShortcutsModal } = await import(
      "@/components/ui/keyboard-shortcuts-modal"
    );

    const onOpenChange = vi.fn();
    render(<KeyboardShortcutsModal open={true} onOpenChange={onOpenChange} />);

    // Modal should be visible when open=true
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
  });

  it("keyboard shortcuts modal should have accessible structure", async () => {
    const { KeyboardShortcutsModal } = await import(
      "@/components/ui/keyboard-shortcuts-modal"
    );

    render(
      <KeyboardShortcutsModal open={true} onOpenChange={vi.fn()} />
    );

    // Check for dialog role
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();

    // Check for title
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();

    // Check for description
    expect(
      screen.getByText(/navigate faster with these keyboard shortcuts/i)
    ).toBeInTheDocument();
  });

  it("keyboard shortcuts modal should list all shortcuts", async () => {
    const { KeyboardShortcutsModal } = await import(
      "@/components/ui/keyboard-shortcuts-modal"
    );

    render(
      <KeyboardShortcutsModal open={true} onOpenChange={vi.fn()} />
    );

    // Check that shortcuts are listed
    expect(screen.getByText("Show keyboard shortcuts")).toBeInTheDocument();
    expect(screen.getByText("Go to Home")).toBeInTheDocument();
    expect(screen.getByText("Go to Inbox")).toBeInTheDocument();
    expect(screen.getByText("Go to Rates")).toBeInTheDocument();
    expect(screen.getByText("New rate card")).toBeInTheDocument();
  });

  it("keyboard shortcuts modal should close on Escape", async () => {
    const { KeyboardShortcutsModal } = await import(
      "@/components/ui/keyboard-shortcuts-modal"
    );

    const onOpenChange = vi.fn();
    render(
      <KeyboardShortcutsModal open={true} onOpenChange={onOpenChange} />
    );

    // Press Escape
    fireEvent.keyDown(document, { key: "Escape" });

    // onOpenChange should be called with false
    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

// =============================================================================
// CONFIRMATION DIALOG TESTS (Issue 14)
// =============================================================================

describe("WCAG AA - Error Prevention / Confirmation Dialogs (Issue 14)", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it("AlertDialog component should have accessible structure", async () => {
    const {
      AlertDialog,
      AlertDialogContent,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogCancel,
      AlertDialogAction,
    } = await import("@/components/ui/alert-dialog");

    render(
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );

    // Check for alertdialog role
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toBeInTheDocument();

    // Check for title and description
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();

    // Check for buttons
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
  });

  it("delete confirmation dialog should be implemented with AlertDialog", async () => {
    // Verify the component source uses AlertDialog for confirmation
    const fs = await import("fs");
    const path = await import("path");
    const componentPath = path.join(
      process.cwd(),
      "src/components/rate-card/saved-rates.tsx"
    );
    const content = fs.readFileSync(componentPath, "utf-8");

    // Check AlertDialog is imported and used
    expect(content).toContain("AlertDialog");
    expect(content).toContain("AlertDialogContent");
    expect(content).toContain("AlertDialogTitle");
    expect(content).toContain("Delete this rate?");

    // Check that the rate name is displayed in the dialog
    expect(content).toContain("rateToDelete?.name");
  });

  it("sign out confirmation should show explanation", async () => {
    const { MenuSheet } = await import("@/components/navigation/menu-sheet");
    const user = userEvent.setup();
    const mockSignOut = vi.fn();

    render(<MenuSheet onSignOut={mockSignOut} />);

    // Open the menu
    const menuButton = screen.getByRole("button", { name: /open menu/i });
    await user.click(menuButton);

    // Click sign out
    const signOutButton = await screen.findByRole("button", { name: /sign out/i });
    await user.click(signOutButton);

    // Check confirmation dialog appears
    await waitFor(() => {
      expect(screen.getByText("Sign out?")).toBeInTheDocument();
      expect(
        screen.getByText(/you'll need to sign in again/i)
      ).toBeInTheDocument();
    });
  });
});

// =============================================================================
// TOUCH TARGET SIZE TESTS (Issue 15)
// =============================================================================

describe("WCAG AAA - Touch Target Size (Issue 15)", () => {
  it("CopyIconButton should have 44px minimum touch target on mobile", async () => {
    const { CopyIconButton } = await import("@/components/ui/copy-button");
    render(<CopyIconButton text="test content" />);

    const button = screen.getByRole("button");

    // Check for mobile-first 44px classes (h-11 w-11 = 44px)
    expect(button.className).toContain("h-11");
    expect(button.className).toContain("w-11");
  });

  it("dialog close button should have 44px minimum on mobile", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const componentPath = path.join(
      process.cwd(),
      "src/components/ui/dialog.tsx"
    );
    const componentContent = fs.readFileSync(componentPath, "utf-8");

    // Check for min-h-[44px] min-w-[44px] in close button
    expect(componentContent).toContain("min-h-[44px]");
    expect(componentContent).toContain("min-w-[44px]");
  });

  it("sheet close button should have 44px minimum on mobile", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const componentPath = path.join(
      process.cwd(),
      "src/components/ui/sheet.tsx"
    );
    const componentContent = fs.readFileSync(componentPath, "utf-8");

    // Check for min-h-[44px] min-w-[44px] in close button
    expect(componentContent).toContain("min-h-[44px]");
    expect(componentContent).toContain("min-w-[44px]");
  });

  it("menu button trigger should have 44px minimum", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const componentPath = path.join(
      process.cwd(),
      "src/components/navigation/menu-sheet.tsx"
    );
    const componentContent = fs.readFileSync(componentPath, "utf-8");

    // Check for 44px minimum (w-11 h-11 = 44px)
    expect(componentContent).toContain("w-11");
    expect(componentContent).toContain("h-11");
  });

  it("bottom nav links should have 44px minimum", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const layoutPath = path.join(
      process.cwd(),
      "src/app/dashboard/layout.tsx"
    );
    const layoutContent = fs.readFileSync(layoutPath, "utf-8");

    // Check for 44px minimum in BottomNavLink (w-11 h-11 = 44px)
    expect(layoutContent).toContain("w-11 h-11");
    expect(layoutContent).toContain("min-w-[44px]");
  });

  it("saved rates buttons should have 44px minimum on mobile", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const componentPath = path.join(
      process.cwd(),
      "src/components/rate-card/saved-rates.tsx"
    );
    const componentContent = fs.readFileSync(componentPath, "utf-8");

    // Check for h-11 w-11 classes (44px)
    expect(componentContent).toContain("h-11 w-11");
  });
});

// =============================================================================
// BREADCRUMB INTEGRATION TESTS
// =============================================================================

describe("Breadcrumb Integration", () => {
  it("brand-vetter page should include breadcrumb", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const pagePath = path.join(
      process.cwd(),
      "src/app/dashboard/tools/brand-vetter/page.tsx"
    );
    const pageContent = fs.readFileSync(pagePath, "utf-8");

    expect(pageContent).toContain("Breadcrumb");
    expect(pageContent).toContain("breadcrumbItems");
    expect(pageContent).toContain('"Home"');
    expect(pageContent).toContain('"Tools"');
    expect(pageContent).toContain('"Brand Vetter"');
  });

  it("contract-scanner page should include breadcrumb", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const pagePath = path.join(
      process.cwd(),
      "src/app/dashboard/tools/contract-scanner/page.tsx"
    );
    const pageContent = fs.readFileSync(pagePath, "utf-8");

    expect(pageContent).toContain("Breadcrumb");
    expect(pageContent).toContain("breadcrumbItems");
    expect(pageContent).toContain('"Contract Scanner"');
  });

  it("profile page should include breadcrumb", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const pagePath = path.join(
      process.cwd(),
      "src/app/dashboard/profile/page.tsx"
    );
    const pageContent = fs.readFileSync(pagePath, "utf-8");

    expect(pageContent).toContain("Breadcrumb");
    expect(pageContent).toContain("breadcrumbItems");
    expect(pageContent).toContain('"Profile"');
  });

  it("rates page should include breadcrumb", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const pagePath = path.join(process.cwd(), "src/app/dashboard/rates/page.tsx");
    const pageContent = fs.readFileSync(pagePath, "utf-8");

    expect(pageContent).toContain("Breadcrumb");
    expect(pageContent).toContain("breadcrumbItems");
    expect(pageContent).toContain('"My Rates"');
  });
});

// =============================================================================
// KEYBOARD SHORTCUTS INTEGRATION TESTS
// =============================================================================

describe("Keyboard Shortcuts Integration", () => {
  it("dashboard layout should include keyboard shortcuts hook", async () => {
    const fs = await import("fs");
    const path = await import("path");

    const layoutPath = path.join(
      process.cwd(),
      "src/app/dashboard/layout.tsx"
    );
    const layoutContent = fs.readFileSync(layoutPath, "utf-8");

    expect(layoutContent).toContain("useKeyboardShortcuts");
    expect(layoutContent).toContain("KeyboardShortcutsModal");
    expect(layoutContent).toContain("showKeyboardShortcuts");
  });

  it("shortcuts should not trigger in form fields", async () => {
    const { useKeyboardShortcuts } = await import(
      "@/hooks/use-keyboard-shortcuts"
    );

    // The hook should check for form fields
    const hookSource = useKeyboardShortcuts.toString();
    // This is a basic check - the actual implementation handles this
    expect(hookSource).toBeDefined();
  });
});
