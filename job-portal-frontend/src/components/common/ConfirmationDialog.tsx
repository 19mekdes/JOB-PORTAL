import React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'

export type ConfirmationVariant = 'default' | 'destructive' | 'warning' | 'success' | 'info'

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  onCancel?: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmationVariant
  isLoading?: boolean
  icon?: React.ReactNode
  showCancel?: boolean
  showConfirm?: boolean
  children?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  confirmButtonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg'
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false,
  icon,
  showCancel = true,
  showConfirm = true,
  children,
  size = 'md',
  confirmButtonVariant
}) => {
  const getConfirmButtonVariant = () => {
    if (confirmButtonVariant) return confirmButtonVariant
    switch (variant) {
      case 'destructive':
        return 'destructive'
      case 'warning':
        return 'default'
      case 'success':
        return 'default'
      default:
        return 'default'
    }
  }

  const getIconColor = () => {
    switch (variant) {
      case 'destructive':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
      case 'success':
        return 'text-green-600'
      case 'info':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={sizeClasses[size]}>
        <AlertDialogHeader>
          {icon && (
            <div className={`mb-2 ${getIconColor()}`}>
              {icon}
            </div>
          )}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {children && (
          <>
            <Separator className="my-2" />
            <div className="py-2">
              {children}
            </div>
            <Separator className="my-2" />
          </>
        )}
        
        <AlertDialogFooter>
          {showCancel && (
            <AlertDialogCancel asChild>
              <Button 
                variant="outline" 
                onClick={onCancel || (() => onOpenChange(false))}
                disabled={isLoading}
              >
                {cancelText}
              </Button>
            </AlertDialogCancel>
          )}
          {showConfirm && (
            <AlertDialogAction asChild>
              <Button 
                variant={getConfirmButtonVariant()}
                onClick={onConfirm}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {confirmText}
              </Button>
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmationDialog