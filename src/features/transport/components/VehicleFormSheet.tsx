import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormSheet } from '@/components/form/FormSheet'
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
import { VEHICLE_TYPES, VEHICLE_STATUS_OPTIONS } from '../constants'
import type { Vehicle, VehicleType, VehicleStatus } from '../types'

const vehicleSchema = z.object({
  registrationNumber: z.string().min(1, 'Registration number is required'),
  type: z.enum(['Bus', 'Van', 'Mini Bus']),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.coerce.number().min(2000).max(2030),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  insuranceExpiry: z.string().min(1, 'Insurance expiry is required'),
  fitnessExpiry: z.string().min(1, 'Fitness expiry is required'),
  pucExpiry: z.string().min(1, 'PUC expiry is required'),
  gpsDeviceId: z.string().optional(),
  status: z.enum(['Active', 'Under Maintenance', 'Inactive']),
})

/**
 * `z.coerce.number()` takes unknown input and yields a number, so the schema's
 * input and output types differ. React Hook Form models that with a third
 * generic: the fields are typed by the schema input, the submit handler by the
 * validated output.
 */
type VehicleFormInput = z.input<typeof vehicleSchema>
type VehicleFormValues = z.output<typeof vehicleSchema>

interface VehicleFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle?: Vehicle | null
  onSave: (data: Partial<Vehicle>) => void
}

export function VehicleFormSheet({ open, onOpenChange, vehicle, onSave }: VehicleFormSheetProps) {
  const isEdit = !!vehicle

  const form = useForm<VehicleFormInput, unknown, VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      registrationNumber: '', type: 'Bus', make: '', model: '',
      year: 2024, capacity: 45, insuranceExpiry: '', fitnessExpiry: '',
      pucExpiry: '', gpsDeviceId: '', status: 'Active',
    },
  })

  useEffect(() => {
    if (vehicle) {
      form.reset({
        registrationNumber: vehicle.registrationNumber, type: vehicle.type,
        make: vehicle.make, model: vehicle.model, year: vehicle.year,
        capacity: vehicle.capacity, insuranceExpiry: vehicle.insuranceExpiry,
        fitnessExpiry: vehicle.fitnessExpiry, pucExpiry: vehicle.pucExpiry,
        gpsDeviceId: vehicle.gpsDeviceId || '', status: vehicle.status,
      })
    } else {
      form.reset()
    }
  }, [vehicle, form])

  const onSubmit = (data: VehicleFormValues) => {
    onSave({
      ...data,
      id: vehicle?.id || `VEH-${Date.now()}`,
      type: data.type as VehicleType,
      status: data.status as VehicleStatus,
    })
    onOpenChange(false)
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Vehicle' : 'Add Vehicle'}
      onSubmit={form.handleSubmit(onSubmit)}
      submitLabel={isEdit ? 'Update Vehicle' : 'Add Vehicle'}
      size="xl"
    >
            {/* Vehicle Details */}
            <FormSection title="Vehicle Details" description="Registration and specifications" width={12}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Registration Number <span className="text-destructive">*</span></Label>
                  <Input {...form.register('registrationNumber')} placeholder="KA-01-XX-1234" />
                  {form.formState.errors.registrationNumber && (
                    <p className="text-xs text-destructive">{form.formState.errors.registrationNumber.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={form.watch('type')} onValueChange={v => form.setValue('type', v as VehicleType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VEHICLE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Make <span className="text-destructive">*</span></Label>
                  <Input {...form.register('make')} placeholder="Tata" />
                </div>
                <div className="space-y-1.5">
                  <Label>Model <span className="text-destructive">*</span></Label>
                  <Input {...form.register('model')} placeholder="Starbus" />
                </div>
                <div className="space-y-1.5">
                  <Label>Year</Label>
                  <Input type="number" {...form.register('year')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Capacity</Label>
                  <Input type="number" {...form.register('capacity')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.watch('status')} onValueChange={v => form.setValue('status', v as VehicleStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {VEHICLE_STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </FormSection>

            {/* Documents */}
            <FormSection title="Documents" description="Expiry dates for vehicle documents" width={12}>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Insurance Expiry <span className="text-destructive">*</span></Label>
                  <Input type="date" {...form.register('insuranceExpiry')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Fitness Expiry <span className="text-destructive">*</span></Label>
                  <Input type="date" {...form.register('fitnessExpiry')} />
                </div>
                <div className="space-y-1.5">
                  <Label>PUC Expiry <span className="text-destructive">*</span></Label>
                  <Input type="date" {...form.register('pucExpiry')} />
                </div>
              </div>
            </FormSection>

            {/* GPS */}
            <FormSection title="GPS Tracking" description="Optional GPS device configuration" width={12}>
              <div className="space-y-1.5">
                <Label>GPS Device ID</Label>
                <Input {...form.register('gpsDeviceId')} placeholder="GPS-XXX" />
              </div>
            </FormSection>
    </FormSheet>
  )
}
