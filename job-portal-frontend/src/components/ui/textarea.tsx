import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const textareaVariants = cva(
  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "min-h-[60px]",
        default: "min-h-[80px]",
        lg: "min-h-[120px]",
        xl: "min-h-[160px]",
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

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size">,
    VariantProps<typeof textareaVariants> {
  showCount?: boolean
  autoResize?: boolean
  maxHeight?: number
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    size, 
    error, 
    showCount, 
    autoResize, 
    maxHeight = 200,
    value, 
    onChange, 
    maxLength,
    ...props 
  }, ref) => {
    const [charCount, setCharCount] = React.useState(0)
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)
    
    // Auto-resize functionality
    React.useEffect(() => {
      if (autoResize && textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        const newHeight = Math.min(textareaRef.current.scrollHeight, maxHeight)
        textareaRef.current.style.height = `${newHeight}px`
      }
    }, [value, autoResize, maxHeight])
    
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length)
      if (onChange) {
        onChange(e)
      }
    }
    
    // Combine refs
    const setRefs = React.useCallback(
      (element: HTMLTextAreaElement) => {
        textareaRef.current = element
        if (typeof ref === 'function') {
          ref(element)
        } else if (ref) {
          ref.current = element
        }
      },
      [ref]
    )
    
    return (
      <div className="relative w-full">
        <textarea
          className={cn(textareaVariants({ size, error }), className)}
          ref={setRefs}
          value={value}
          onChange={handleChange}
          maxLength={maxLength}
          {...props}
        />
        {showCount && maxLength && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-400">
            {charCount}/{maxLength}
          </div>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

// Formatted Textarea with Rich Text Support (basic)
interface RichTextareaProps extends TextareaProps {
  format?: boolean
}

const RichTextarea: React.FC<RichTextareaProps> = ({ format, className, ...props }) => {
  const [isFocused, setIsFocused] = React.useState(false)
  
  return (
    <div className={cn("relative", className)}>
      {format && isFocused && (
        <div className="absolute -top-8 left-0 flex gap-1 bg-white border rounded-md p-1 shadow-sm">
          <button className="p-1 hover:bg-gray-100 rounded" type="button">
            <strong>B</strong>
          </button>
          <button className="p-1 hover:bg-gray-100 rounded" type="button">
            <em>I</em>
          </button>
          <button className="p-1 hover:bg-gray-100 rounded" type="button">
            <u>U</u>
          </button>
        </div>
      )}
      <Textarea
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
    </div>
  )
}

export { Textarea, RichTextarea }