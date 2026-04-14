import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { FormSection } from '@/components/form/FormSection'
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
import { FEE_TERMS } from '../constants'
import { mockRoutes } from '../mocks'
import type { TransportFeeStructure } from '../types'

const feeSchema = z.object({
  routeId: z.string().min(1, 'Route is required'),
  distanceSlab: z.string().min(1, 'Distance slab is required'),
  oneWayFee: z.coerce.number().min(0),
  twoWayFee: z.coerce.number().min(0),
  term: z.string().min(1, 'Term is required'),
})

type FeeFormValues = z.infer<typeof feeSchema>

interface FeeStructureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feeStructure?: TransportFeeStructure | null
  onSave: (data: Partial<TransportFeeStructure>) => void
}

export function FeeStructureDialog({ open, onOpenChange, feeStructure, onSave }: FeeStructureDialogProps) {
  const isEdit = !!feeStructure

  const form = useForm<FeeFormValues>({
    resolver: zodResolver(feeSchema),
    defaultValues: {
      routeId: '', distanceSlab: '', oneWayFee: 0, twoWayFee: 0, term: 'Term 1',
    },
  })

  useEffect(() => {
    if (feeStructure) {
      form.reset({
        routeId: feeStructure.routeId,
        distanceSlab: feeStructure.distanceSlab,
        oneWayFee: feeStructure.oneWayFee,
        twoWayFee: feeStructure.twoWayFee,
        term: feeStructure.term,
      })
    } else {
      form.reset()
    }
  }, [feeStructure, form])

  const onSubmit = (data: FeeFormValues) => {
    const route = mockRoutes.find(r => r.id === data.routeId)
    onSave({
      ...data,
      id: feeStructure?.id || `FEE-${Date.now()}`,
      routeName: route?.name || '',
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>{isEdit ? 'Edit Fee Structure' : 'Add Fee Structure'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
          <FormSection title="Fee Details" width={12}>
            <div className="space-y-1.5">
              <Label>Route <span className="text-destructive">*</span></Label>
            <Select value={form.watch('routeId')} onValueChange={v => form.setValue('routeId', v)}>
              <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
              <SelectContent>
                {mockRoutes.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Distance Slab</Label>
              <Input {...form.register('distanceSlab')} placeholder="10-15 km" />
            </div>
            <div className="space-y-1.5">
              <Label>Term</Label>
              <Select value={form.watch('term')} onValueChange={v => form.setValue('term', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FEE_TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>One-way Fee</Label>
                <Input type="number" {...form.register('oneWayFee')} />
              </div>
              <div className="space-y-1.5">
                <Label>Two-way Fee</Label>
                <Input type="number" {...form.register('twoWayFee')} />
              </div>
            </div>
          </FormSection>

          <DialogFooter className="px-6 pb-6 pt-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-foreground">
              {isEdit ? 'Update' : 'Add Fee Structure'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
