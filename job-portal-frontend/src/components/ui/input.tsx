import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        default: "h-10",
        sm: "h-8 text-xs",
        lg: "h-12 text-base",
      },
      error: {
        true: "border-red-500 focus-visible:ring-red-500",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  clearable?: boolean
  onClear?: () => void
  characterCount?: boolean
  maxLength?: number
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type, 
    size, 
    error, 
    icon, 
    iconPosition = "left",
    clearable,
    onClear,
    characterCount,
    maxLength,
    value,
    onChange,
    ...props 
  }, ref) => {
    const [showClear, setShowClear] = React.useState(false)
    const inputValue = value as string || ""

    React.useEffect(() => {
      if (clearable && inputValue.length > 0) {
        setShowClear(true)
      } else {
        setShowClear(false)
      }
    }, [inputValue, clearable])

    return (
      <div className="relative w-full">
        {icon && iconPosition === "left" && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}
        
        <input
          type={type}
          className={cn(
            inputVariants({ size, error }),
            icon && iconPosition === "left" && "pl-10",
            (iconPosition === "right" || clearable) && "pr-10",
            className
          )}
          ref={ref}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          {...props}
        />
        
        {icon && iconPosition === "right" && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}
        
        {clearable && showClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
        
        {characterCount && maxLength && (
          <div className="absolute right-3 -bottom-5 text-xs text-gray-400">
            {inputValue.length}/{maxLength}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }