import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormSheet } from '@/components/form/FormSheet'
import { FormSection } from '@/components/form/FormSection'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mockRoutes } from '@/mocks/transport'
import type { StudentTransportAssignment, TransportType, FeeStatus } from '../types'

const assignmentSchema = z.object({
  studentName: z.string().min(1, 'Student name is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  class: z.string().min(1, 'Class is required'),
  section: z.string().min(1, 'Section is required'),
  routeId: z.string().min(1, 'Route is required'),
  stopId: z.string().min(1, 'Stop is required'),
  type: z.enum(['one-way', 'two-way']),
})

type AssignmentFormValues = z.infer<typeof assignmentSchema>

interface AssignStudentFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment?: StudentTransportAssignment | null
  onSave: (data: Partial<StudentTransportAssignment>) => void
}

export function AssignStudentFormSheet({ open, onOpenChange, assignment, onSave }: AssignStudentFormSheetProps) {
  const isEdit = !!assignment

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      studentName: '', studentId: '', class: '', section: '',
      routeId: '', stopId: '', type: 'two-way',
    },
  })

  const selectedRouteId = form.watch('routeId')
  const selectedRoute = useMemo(() => mockRoutes.find(r => r.id === selectedRouteId), [selectedRouteId])

  useEffect(() => {
    if (assignment) {
      form.reset({
        studentName: assignment.studentName,
        studentId: assignment.studentId,
        class: assignment.class,
        section: assignment.section,
        routeId: assignment.routeId,
        stopId: assignment.stopId,
        type: assignment.type,
      })
    } else {
      form.reset()
    }
  }, [assignment, form])

  const onSubmit = (data: AssignmentFormValues) => {
    const route = mockRoutes.find(r => r.id === data.routeId)
    const stop = route?.stops.find(s => s.id === data.stopId)
    onSave({
      ...data,
      id: assignment?.id || `STA-${Date.now()}`,
      routeName: route?.name || '',
      stopName: stop?.name || '',
      pickupTime: stop?.pickupTime || '',
      dropTime: stop?.dropTime || '',
      type: data.type as TransportType,
      feeStatus: assignment?.feeStatus || 'Pending' as FeeStatus,
    })
    onOpenChange(false)
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Assignment' : 'Assign Student'}
      onSubmit={form.handleSubmit(onSubmit)}
      submitLabel={isEdit ? 'Update' : 'Assign'}
    >
          <FormSection title="Student Details" width={12}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Student Name <span className="text-destructive">*</span></Label>
                <Input {...form.register('studentName')} placeholder="Full name" />
                {form.formState.errors.studentName && <p className="text-xs text-destructive">{form.formState.errors.studentName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Student ID <span className="text-destructive">*</span></Label>
                <Input {...form.register('studentId')} placeholder="S-001" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Class <span className="text-destructive">*</span></Label>
                <Input {...form.register('class')} placeholder="10A" />
              </div>
              <div className="space-y-1.5">
                <Label>Section <span className="text-destructive">*</span></Label>
                <Input {...form.register('section')} placeholder="A" />
              </div>
            </div>
          </FormSection>

          <FormSection title="Transport Assignment" width={12}>
            <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Route</Label>
              <Select
                value={form.watch('routeId')}
                onValueChange={v => { form.setValue('routeId', v); form.setValue('stopId', '') }}
              >
                <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                <SelectContent>
                  {mockRoutes.filter(r => r.status === 'Active').map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Stop</Label>
              <Select value={form.watch('stopId')} onValueChange={v => form.setValue('stopId', v)}>
                <SelectTrigger><SelectValue placeholder="Select stop" /></SelectTrigger>
                <SelectContent>
                  {selectedRoute?.stops.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  )) || []}
                </SelectContent>
              </Select>
            </div>
          </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.watch('type')} onValueChange={v => form.setValue('type', v as TransportType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-way">One-Way</SelectItem>
                  <SelectItem value="two-way">Two-Way</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </FormSection>

    </FormSheet>
  )
}
