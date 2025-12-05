import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

/**
 * Input field component with label, icons, error states, and accessibility support.
 * Extends native input attributes for full HTML input compatibility.
 */
export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label text displayed above the input */
  label?: string;
  /** Helper text shown below the input (hidden when error is present) */
  subLabel?: string;
  /** Shows required asterisk and sets required/aria-required attributes */
  requiredMark?: boolean;
  /** Error message displayed below input with error styling */
  error?: string;
  /** Custom className for the wrapper div */
  wrapperClassName?: string;
  /** Custom className for the label */
  labelClassName?: string;
  /** Custom className for the subLabel */
  subLabelClassName?: string;
  /** Icon rendered on the left side of input */
  leftIcon?: React.ReactNode;
  /** Icon rendered on the right side of input */
  rightIcon?: React.ReactNode;
  /** Makes rightIcon clickable (removes pointer-events-none) */
  rightIconClickable?: boolean;
}

/**
 * InputField - A customizable input component with label, icons, and error handling.
 */
export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      label,
      subLabel,
      requiredMark,
      error,
      wrapperClassName,
      labelClassName,
      subLabelClassName,
      leftIcon,
      rightIcon,
      rightIconClickable = false,
      className,
      disabled,
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = React.useId();
    const finalId = id || inputId;
    const errorId = `${finalId}-error`;
    const subLabelId = `${finalId}-sublabel`;

    // Build aria-describedby for accessibility
    const describedBy =
      [error && errorId, subLabel && !error && subLabelId]
        .filter(Boolean)
        .join(" ") || undefined;

    return (
      <div className={cn("flex flex-col gap-1 w-full", wrapperClassName)}>
        {label && (
          <label
            htmlFor={finalId}
            className={cn(
              "text-sm font-medium text-gray-700",
              disabled && "opacity-60",
              labelClassName,
            )}
          >
            {label}
            {requiredMark && (
              <span className="text-red-500" aria-label="required">
                {" "}
                *
              </span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span
              className={cn(
                "absolute left-3 pointer-events-none",
                disabled ? "text-gray-500" : "text-gray-400",
              )}
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}

          <Input
            ref={ref}
            id={finalId}
            disabled={disabled}
            required={requiredMark}
            aria-required={requiredMark}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={describedBy}
            className={cn(
              "h-11 rounded-xl border transition-all",
              "focus-visible:ring-2 focus-visible:ring-primary",
              disabled
                ? "bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-white",
              !disabled && error
                ? "border-red-500 focus-visible:ring-red-500"
                : !disabled && "border-gray-300",
              leftIcon ? "pl-10" : "pl-3",
              rightIcon ? "pr-10" : "pr-3",
              className,
            )}
            {...props}
          />

          {rightIcon && (
            <span
              className={cn(
                "absolute right-3",
                disabled ? "text-gray-500" : "text-gray-400",
                !rightIconClickable && "pointer-events-none",
              )}
              aria-hidden={!rightIconClickable}
            >
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p
            id={errorId}
            role="alert"
            className={cn("text-xs text-red-500", disabled && "opacity-60")}
          >
            {error}
          </p>
        )}

        {subLabel && !error && (
          <p
            id={subLabelId}
            className={cn(
              "text-xs text-gray-500",
              disabled && "opacity-60",
              subLabelClassName,
            )}
          >
            {subLabel}
          </p>
        )}
      </div>
    );
  },
);

InputField.displayName = "InputField";
