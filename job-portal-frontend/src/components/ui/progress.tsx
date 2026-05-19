/* eslint-disable react-hooks/set-state-in-effect */
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const progressVariants = cva(
  "h-full w-full flex-1 transition-all duration-500",
  {
    variants: {
      variant: {
        default: "bg-primary",
        success: "bg-green-500",
        warning: "bg-yellow-500",
        destructive: "bg-red-500",
        info: "bg-blue-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  indicatorClassName?: string
  showLabel?: boolean
  labelPosition?: "inside" | "outside" | "right"
  labelFormat?: "percentage" | "fraction"
  animate?: boolean
  max?: number
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ 
  className, 
  value, 
  variant,
  indicatorClassName,
  showLabel = false,
  labelPosition = "outside",
  labelFormat = "percentage",
  animate = true,
  max = 100,
  ...props 
}, ref) => {
  const [currentValue, setCurrentValue] = React.useState<number>(0)

  React.useEffect(() => {
    if (animate && value !== undefined && value !== null) {
      const timer = setTimeout(() => {
        setCurrentValue(value)
      }, 100)
      return () => clearTimeout(timer)
    } else if (value !== undefined && value !== null) {
      setCurrentValue(value)
    }
  }, [value, animate])

  const displayValue = currentValue !== undefined && currentValue !== null 
    ? Math.min(100, Math.max(0, currentValue)) 
    : 0

  const getLabel = () => {
    if (labelFormat === "percentage") {
      return `${Math.round(displayValue)}%`
    }
    return `${Math.round((displayValue / 100) * max)}/${max}`
  }

  const ProgressBar = (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          progressVariants({ variant }),
          "transition-all",
          animate && "duration-500 ease-out",
          indicatorClassName
        )}
        style={{ transform: `translateX(-${100 - displayValue}%)` }}
      />
    </ProgressPrimitive.Root>
  )

  if (!showLabel) {
    return ProgressBar
  }

  if (labelPosition === "inside") {
    return (
      <div className="relative">
        {ProgressBar}
        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
          {getLabel()}
        </span>
      </div>
    )
  }

  if (labelPosition === "right") {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1">{ProgressBar}</div>
        <span className="text-sm font-medium text-gray-700 min-w-11.25">
          {getLabel()}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Progress</span>
        <span className="font-medium text-gray-900">{getLabel()}</span>
      </div>
      {ProgressBar}
    </div>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

// Simple Progress Component (without labels)
interface SimpleProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number
}

const SimpleProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  SimpleProgressProps
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all duration-300"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
SimpleProgress.displayName = "SimpleProgress"

// Circular Progress Component
interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  variant?: "default" | "success" | "warning" | "destructive" | "info"
  showLabel?: boolean
  label?: string
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 120,
  strokeWidth = 8,
  variant = "default",
  showLabel = true,
  label,
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  const variantColors = {
    default: "text-primary",
    success: "text-green-500",
    warning: "text-yellow-500",
    destructive: "text-red-500",
    info: "text-blue-500",
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={cn("transition-all duration-500", variantColors[variant])}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{Math.round(value)}%</span>
          {label && <span className="text-xs text-gray-500">{label}</span>}
        </div>
      )}
    </div>
  )
}

export { Progress, SimpleProgress, CircularProgress }