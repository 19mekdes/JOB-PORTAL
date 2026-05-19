import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const separatorVariants = cva(
  "shrink-0 bg-border",
  {
    variants: {
      variant: {
        default: "bg-border",
        light: "bg-gray-200",
        dark: "bg-gray-700",
        primary: "bg-primary",
      },
      thickness: {
        thin: "h-[1px] w-full",
        medium: "h-[2px] w-full",
        thick: "h-[3px] w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      thickness: "thin",
    },
  }
)

export interface SeparatorProps
  extends React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>,
    VariantProps<typeof separatorVariants> {
  label?: string
  labelPosition?: "left" | "center" | "right"
}

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(
  ({ 
    className, 
    orientation = "horizontal", 
    decorative = true, 
    variant,
    thickness,
    label,
    labelPosition = "center",
    ...props 
  }, ref) => {
    // For vertical separators, don't show labels
    if (orientation === "vertical") {
      return (
        <SeparatorPrimitive.Root
          ref={ref}
          decorative={decorative}
          orientation={orientation}
          className={cn(
            "shrink-0 bg-border",
            "h-full w-px",
            className
          )}
          {...props}
        />
      )
    }

    // With label (horizontal only)
    if (label) {
      return (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <SeparatorPrimitive.Root
              ref={ref}
              decorative={decorative}
              orientation={orientation}
              className={cn(
                separatorVariants({ variant, thickness }),
                className
              )}
              {...props}
            />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className={cn(
              "bg-background px-2 text-muted-foreground",
              labelPosition === "left" && "ml-0 mr-auto",
              labelPosition === "center" && "mx-auto",
              labelPosition === "right" && "ml-auto mr-0"
            )}>
              {label}
            </span>
          </div>
        </div>
      )
    }

    // Without label (horizontal)
    return (
      <SeparatorPrimitive.Root
        ref={ref}
        decorative={decorative}
        orientation={orientation}
        className={cn(
          separatorVariants({ variant, thickness }),
          className
        )}
        {...props}
      />
    )
  }
)
Separator.displayName = SeparatorPrimitive.Root.displayName

// Dashed Separator
interface DashedSeparatorProps extends SeparatorProps {
  dashLength?: number
  gapLength?: number
}

const DashedSeparator: React.FC<DashedSeparatorProps> = ({ 
  className,
  dashLength = 8,
  gapLength = 4,
  orientation = "horizontal",
  ...props 
}) => {
  if (orientation === "vertical") {
    return (
      <div 
        className={cn("w-px h-full bg-repeat-y", className)}
        style={{
          backgroundImage: `repeating-linear-gradient(180deg, currentColor 0px, currentColor ${dashLength}px, transparent ${dashLength}px, transparent ${dashLength + gapLength}px)`,
          color: 'rgb(209, 213, 219)',
        }}
        {...props}
      />
    )
  }
  
  return (
    <div 
      className={cn("w-full h-px bg-repeat-x", className)}
      style={{
        backgroundImage: `repeating-linear-gradient(90deg, currentColor 0px, currentColor ${dashLength}px, transparent ${dashLength}px, transparent ${dashLength + gapLength}px)`,
        color: 'rgb(209, 213, 219)',
      }}
      {...props}
    />
  )
}

// Gradient Separator
const GradientSeparator: React.FC<SeparatorProps> = ({ className, orientation = "horizontal", ...props }) => {
  if (orientation === "vertical") {
    return (
      <div
        className={cn("w-0.5 h-full bg-linear-to-b from-transparent via-primary to-transparent", className)}
        {...props}
      />
    )
  }
  
  return (
    <div
      className={cn("h-0.5 w-full bg-linear-to-r from-transparent via-primary to-transparent", className)}
      {...props}
    />
  )
}

export { Separator, DashedSeparator, GradientSeparator }