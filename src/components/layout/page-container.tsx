import { cn } from "@/lib/utils";
import { layout, type ContainerWidth } from "@/lib/layout";

interface PageContainerProps {
  /** Page title displayed as h1 */
  title: string;
  /** Optional page description */
  description?: string;
  /** Page content */
  children: React.ReactNode;
  /** Container max width: sm (672px), md (896px), lg (1024px) */
  maxWidth?: ContainerWidth;
  /** Center the header text */
  centerHeader?: boolean;
  /** Optional icon to show next to title */
  icon?: React.ReactNode;
  /** Additional classes for the container */
  className?: string;
  /** Additional content to render in the header (e.g., action buttons) */
  headerAction?: React.ReactNode;
}

/**
 * Consistent page container with header and content spacing.
 *
 * Note: The dashboard layout already provides outer padding (py-6/8/10).
 * This component provides consistent inner structure without duplicating that padding.
 */
export function PageContainer({
  title,
  description,
  children,
  maxWidth = "md",
  centerHeader = false,
  icon,
  className,
  headerAction,
}: PageContainerProps) {
  const widthClass = layout.container[maxWidth];

  return (
    <div className={cn("mx-auto", widthClass, className)}>
      {/* Page Header */}
      <header
        className={cn(
          centerHeader ? layout.pageHeaderCentered : layout.pageHeader,
          headerAction && !centerHeader && "flex items-start justify-between"
        )}
      >
        <div className={cn(centerHeader && "space-y-2")}>
          {icon && centerHeader ? (
            <div className="flex items-center justify-center gap-2 mb-2">
              {icon}
              <h1 className="text-2xl font-display font-bold md:text-3xl">
                {title}
              </h1>
            </div>
          ) : (
            <h1 className="text-2xl font-display font-bold">{title}</h1>
          )}
          {description && (
            <p
              className={cn(
                "text-muted-foreground",
                centerHeader && "max-w-2xl mx-auto"
              )}
            >
              {description}
            </p>
          )}
        </div>
        {headerAction && !centerHeader && headerAction}
      </header>

      {/* Main Content */}
      <div className={layout.spacing.section}>{children}</div>
    </div>
  );
}
