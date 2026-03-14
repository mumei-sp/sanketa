import * as React from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PasswordFieldProps<T extends FieldValues> {
  name: FieldPath<T>
  control: Control<T>
  label?: string
  placeholder?: string
  className?: string
}

export function PasswordField<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  className,
}: PasswordFieldProps<T>) {
  const fieldId = React.useId()
  const [showPassword, setShowPassword] = React.useState(false)

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className={cn('space-y-2', className)}>
          {label && <Label htmlFor={fieldId}>{label}</Label>}
          <div className="relative">
            <Input
              id={fieldId}
              type={showPassword ? 'text' : 'password'}
              placeholder={placeholder}
              {...field}
              value={field.value != null ? field.value : ''}
              aria-invalid={fieldState.error ? 'true' : 'false'}
              aria-describedby={fieldState.error ? `${fieldId}-error` : undefined}
              className={cn(
                'pr-10',
                fieldState.error && 'border-destructive focus-visible:ring-destructive',
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword(prev => !prev)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {fieldState.error && (
            <p id={`${fieldId}-error`} role="alert" className="text-destructive text-sm">
              {fieldState.error.message}
            </p>
          )}
        </div>
      )}
    />
  )
}
