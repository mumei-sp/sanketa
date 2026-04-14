import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormSection } from '@/components/form/FormSection'
import { DRIVER_STATUS_OPTIONS } from '../constants'
import type { TransportDriver, DriverStatus } from '../types'

const driverSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(10, 'Valid phone is required'),
  emergencyContact: z.string().min(10, 'Valid emergency contact is required'),
  address: z.string().min(1, 'Address is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  licenseType: z.string().min(1, 'License type is required'),
  licenseExpiry: z.string().min(1, 'License expiry is required'),
  experience: z.coerce.number().min(0),
  backgroundVerified: z.boolean(),
  status: z.enum(['Active', 'On Leave', 'Inactive']),
})

type DriverFormValues = z.infer<typeof driverSchema>

interface DriverDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  driver?: TransportDriver | null
  onSave: (data: Partial<TransportDriver>) => void
}

export function DriverDialog({ open, onOpenChange, driver, onSave }: DriverDialogProps) {
  const isEdit = !!driver

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      firstName: '', lastName: '', phone: '', emergencyContact: '',
      address: '', licenseNumber: '', licenseType: 'HMV',
      licenseExpiry: '', experience: 0, backgroundVerified: false, status: 'Active',
    },
  })

  useEffect(() => {
    if (driver) {
      form.reset({
        firstName: driver.firstName, lastName: driver.lastName,
        phone: driver.phone, emergencyContact: driver.emergencyContact,
        address: driver.address, licenseNumber: driver.licenseNumber,
        licenseType: driver.licenseType, licenseExpiry: driver.licenseExpiry,
        experience: driver.experience, backgroundVerified: driver.backgroundVerified,
        status: driver.status,
      })
    } else {
      form.reset()
    }
  }, [driver, form])

  const onSubmit = (data: DriverFormValues) => {
    onSave({
      ...data,
      id: driver?.id || `DRV-${Date.now()}`,
      status: data.status as DriverStatus,
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] p-0 gap-0 overflow-y-auto">
        <SheetHeader className="px-6 pt-6 pb-0">
          <SheetTitle>{isEdit ? 'Edit Driver' : 'Add Driver'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
          <div className="px-6 py-4 space-y-4">
            {/* Personal Information */}
            <FormSection title="Personal Information" description="Driver's basic details" width={12}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>First Name <span className="text-destructive">*</span></Label>
                  <Input {...form.register('firstName')} />
                  {form.formState.errors.firstName && <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Last Name <span className="text-destructive">*</span></Label>
                  <Input {...form.register('lastName')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Phone <span className="text-destructive">*</span></Label>
                  <Input {...form.register('phone')} placeholder="9876543210" />
                </div>
                <div className="space-y-1.5">
                  <Label>Emergency Contact <span className="text-destructive">*</span></Label>
                  <Input {...form.register('emergencyContact')} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Address <span className="text-destructive">*</span></Label>
                <Input {...form.register('address')} />
              </div>
            </FormSection>

            {/* License & Qualification */}
            <FormSection title="License & Qualification" description="Driving license and experience details" width={12}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>License Number <span className="text-destructive">*</span></Label>
                  <Input {...form.register('licenseNumber')} />
                </div>
                <div className="space-y-1.5">
                  <Label>License Type</Label>
                  <Select value={form.watch('licenseType')} onValueChange={v => form.setValue('licenseType', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HMV">HMV</SelectItem>
                      <SelectItem value="LMV">LMV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>License Expiry <span className="text-destructive">*</span></Label>
                  <Input type="date" {...form.register('licenseExpiry')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Experience (years)</Label>
                  <Input type="number" {...form.register('experience')} />
                </div>
              </div>
            </FormSection>

            {/* Status */}
            <FormSection title="Status" description="Current status and verification" width={12}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.watch('status')} onValueChange={v => form.setValue('status', v as DriverStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DRIVER_STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 flex items-end">
                  <label className="flex items-center gap-2 h-9">
                    <input type="checkbox" {...form.register('backgroundVerified')} className="rounded" />
                    <span className="text-sm">Background Verified</span>
                  </label>
                </div>
              </div>
            </FormSection>
          </div>

          <SheetFooter className="px-6 py-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-foreground">
              {isEdit ? 'Update Driver' : 'Add Driver'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
