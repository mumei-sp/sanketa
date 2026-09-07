import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormSheet } from '@/components/form/FormSheet'
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
import { Plus, Trash2 } from 'lucide-react'
import { ROUTE_STATUS_OPTIONS, ROUTE_TYPE_OPTIONS } from '../constants'
import { mockVehicles, mockDrivers } from '@/mocks/transport'
import type { TransportRoute } from '../types'

const stopSchema = z.object({
  name: z.string().min(1, 'Stop name is required'),
  pickupTime: z.string().min(1, 'Pickup time is required'),
  dropTime: z.string().min(1, 'Drop time is required'),
})

const routeSchema = z.object({
  name: z.string().min(1, 'Route name is required'),
  code: z.string().min(1, 'Route code is required'),
  startLocation: z.string().min(1, 'Start location is required'),
  endLocation: z.string().min(1, 'End location is required'),
  type: z.enum(['one-way', 'two-way']),
  distanceKm: z.coerce.number().min(0.1),
  estimatedDuration: z.string().min(1),
  vehicleId: z.string(),
  driverId: z.string(),
  status: z.enum(['Active', 'Inactive']),
  stops: z.array(stopSchema).min(1, 'At least one stop is required'),
})

/**
 * `z.coerce.number()` takes unknown input and yields a number, so the schema's
 * input and output types differ. React Hook Form models that with a third
 * generic: the fields are typed by the schema input, the submit handler by the
 * validated output.
 */
type RouteFormInput = z.input<typeof routeSchema>
type RouteFormValues = z.output<typeof routeSchema>

interface RouteFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  route?: TransportRoute | null
  onSave: (data: Partial<TransportRoute>) => void
}

export function RouteFormSheet({ open, onOpenChange, route, onSave }: RouteFormSheetProps) {
  const isEdit = !!route

  const form = useForm<RouteFormInput, unknown, RouteFormValues>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      name: '', code: '', startLocation: 'School Campus', endLocation: '',
      type: 'two-way', distanceKm: 0, estimatedDuration: '',
      vehicleId: '', driverId: '', status: 'Active',
      stops: [{ name: '', pickupTime: '', dropTime: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'stops' })

  useEffect(() => {
    if (route) {
      form.reset({
        name: route.name, code: route.code,
        startLocation: route.startLocation, endLocation: route.endLocation,
        type: route.type, distanceKm: route.distanceKm,
        estimatedDuration: route.estimatedDuration,
        vehicleId: route.vehicleId, driverId: route.driverId,
        status: route.status,
        stops: route.stops.map(s => ({ name: s.name, pickupTime: s.pickupTime, dropTime: s.dropTime })),
      })
    } else {
      form.reset()
    }
  }, [route, form])

  const onSubmit = (data: RouteFormValues) => {
    const vehicle = mockVehicles.find(v => v.id === data.vehicleId)
    const driver = mockDrivers.find(d => d.id === data.driverId)
    onSave({
      ...data,
      id: route?.id || `RT-${Date.now()}`,
      vehicleName: vehicle?.registrationNumber || '',
      driverName: driver ? `${driver.firstName} ${driver.lastName}` : '',
      studentsAssigned: route?.studentsAssigned || 0,
      capacity: vehicle?.capacity || 0,
      stops: data.stops.map((s, i) => ({
        id: route?.stops[i]?.id || `S-${Date.now()}-${i}`,
        name: s.name,
        sequence: i + 1,
        pickupTime: s.pickupTime,
        dropTime: s.dropTime,
        studentsCount: route?.stops[i]?.studentsCount || 0,
      })),
    })
    onOpenChange(false)
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Route' : 'Add Route'}
      onSubmit={form.handleSubmit(onSubmit)}
      submitLabel={isEdit ? 'Update Route' : 'Add Route'}
      size="xl"
    >
            {/* Route Information */}
            <FormSection title="Route Information" description="Basic route details" width={12}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Route Name <span className="text-destructive">*</span></Label>
                  <Input {...form.register('name')} placeholder="Route A - Jayanagar" />
                  {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Code <span className="text-destructive">*</span></Label>
                  <Input {...form.register('code')} placeholder="RT-A" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Start Location</Label>
                  <Input {...form.register('startLocation')} />
                </div>
                <div className="space-y-1.5">
                  <Label>End Location</Label>
                  <Input {...form.register('endLocation')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={form.watch('type')} onValueChange={v => form.setValue('type', v as 'one-way' | 'two-way')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROUTE_TYPE_OPTIONS.map(t => <SelectItem key={t} value={t}>{t === 'two-way' ? 'Two-Way' : 'One-Way'}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.watch('status')} onValueChange={v => form.setValue('status', v as 'Active' | 'Inactive')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROUTE_STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Distance (km)</Label>
                  <Input type="number" step="0.1" {...form.register('distanceKm')} />
                </div>
                <div className="space-y-1.5">
                  <Label>Duration</Label>
                  <Input {...form.register('estimatedDuration')} placeholder="45 min" />
                </div>
              </div>
            </FormSection>

            {/* Assignment */}
            <FormSection title="Assignment" description="Assign vehicle and driver" width={12}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Vehicle</Label>
                  <Select value={form.watch('vehicleId')} onValueChange={v => form.setValue('vehicleId', v)}>
                    <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                    <SelectContent>
                      {mockVehicles.filter(v => v.status === 'Active').map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.registrationNumber}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Driver</Label>
                  <Select value={form.watch('driverId')} onValueChange={v => form.setValue('driverId', v)}>
                    <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                    <SelectContent>
                      {mockDrivers.filter(d => d.status === 'Active').map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.firstName} {d.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </FormSection>

            {/* Stops */}
            <FormSection title="Stops" description="Define route stops in order" width={12}>
              {/* Header row — the columns only exist from `md`, where the row
                  is laid out side by side. */}
              <div className="hidden items-center gap-2 px-2 md:flex">
                <span className="w-5 shrink-0" />
                <span className="flex-1 text-xs font-medium text-muted-foreground">Stop Name</span>
                <span className="w-[110px] text-xs font-medium text-muted-foreground">Pickup</span>
                <span className="w-[110px] text-xs font-medium text-muted-foreground">Drop</span>
                <span className="size-7 shrink-0" />
              </div>
              <div className="space-y-2">
                {fields.map((field, index) => (
                  /* Name + two times + delete need ~300px of fixed width, which
                     leaves the name input 4px on a phone. Below `md` the times
                     wrap onto their own line under the name. */
                  <div key={field.id} className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <span className="text-xs text-muted-foreground w-5 shrink-0 text-center">{index + 1}.</span>
                    <Input
                      {...form.register(`stops.${index}.name`)}
                      placeholder="Stop name"
                      className="h-8 min-w-0 flex-1"
                    />
                    <div className="flex items-center gap-2 max-md:w-full max-md:pl-7">
                      <Input
                        type="time"
                        aria-label={`Stop ${index + 1} pickup time`}
                        {...form.register(`stops.${index}.pickupTime`)}
                        className="h-8 min-w-0 flex-1 md:w-[110px] md:flex-none"
                      />
                      <Input
                        type="time"
                        aria-label={`Stop ${index + 1} drop time`}
                        {...form.register(`stops.${index}.dropTime`)}
                        className="h-8 min-w-0 flex-1 md:w-[110px] md:flex-none"
                      />
                      {fields.length > 1 ? (
                        <Button type="button" variant="ghost" size="icon" className="size-7 text-destructive shrink-0" onClick={() => remove(index)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      ) : <span className="size-7 shrink-0" />}
                    </div>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="h-7 gap-1" onClick={() => append({ name: '', pickupTime: '', dropTime: '' })}>
                <Plus className="size-3" /> Add Stop
              </Button>
              {form.formState.errors.stops && (
                <p className="text-xs text-destructive">{form.formState.errors.stops.message || form.formState.errors.stops.root?.message}</p>
              )}
            </FormSection>
    </FormSheet>
  )
}
