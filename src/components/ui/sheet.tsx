"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  style,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      style={style}
      {...props}
    />
  )
}

const SheetLevelContext = React.createContext(0)

type SheetSize = "sm" | "md" | "lg" | "xl" | "2xl" | "full"

/**
 * Side-sheet widths.
 *
 * Below `md` every size is full-bleed. A partial side panel is a desktop idea:
 * on a phone it leaves a dead sliver of dimmed page that can't be read or
 * usefully tapped, and it steals width the content needs. Phones get the
 * full-screen presentation that mobile apps actually use for this
 * (Gmail compose, Material's full-screen dialog); the panel only becomes a
 * side sheet once there is a desktop-sized page to sit beside.
 */
const sizeClasses: Record<SheetSize, string> = {
  sm: "w-full md:w-3/4 md:max-w-sm",
  md: "w-full md:w-3/4 md:max-w-md",
  lg: "w-full md:w-3/4 md:max-w-lg",
  xl: "w-full md:w-3/4 md:max-w-2xl",
  "2xl": "w-full md:w-3/4 md:max-w-4xl",
  full: "w-full",
}

function SheetContent({
  className,
  children,
  side = "right",
  size = "sm",
  style,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
  size?: SheetSize
}) {
  const level = React.useContext(SheetLevelContext)
  const zIndex = 50 + level * 10

  return (
    <SheetPortal>
      <SheetOverlay style={{ zIndex }} />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          side === "right" &&
            `data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full border-l ${sizeClasses[size]}`,
          side === "left" &&
            `data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full border-r ${sizeClasses[size]}`,
          // Top/bottom sheets cap their height so a long body scrolls inside
          // the sheet instead of running past the viewport.
          side === "top" &&
            "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto max-h-[90dvh] overflow-y-auto overscroll-contain border-b",
          side === "bottom" &&
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto max-h-[90dvh] overflow-y-auto overscroll-contain border-t",
          className
        )}
        style={{ zIndex, ...style }}
        {...props}
      >
        <SheetLevelContext.Provider value={level + 1}>
          {children}
        </SheetLevelContext.Provider>
        <SheetPrimitive.Close className="tap-target ring-offset-background focus:ring-ring absolute top-3 right-3 flex items-center justify-center rounded-md p-2 cursor-pointer opacity-60 transition-all hover:opacity-100 hover:bg-black/6 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}

export type { SheetSize }
