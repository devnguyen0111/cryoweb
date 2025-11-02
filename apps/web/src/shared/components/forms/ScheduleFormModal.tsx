import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@workspace/ui/components/Dialog'
import { Button } from '@workspace/ui/components/Button'
import { Input } from '@workspace/ui/components/Textfield'
import { Switch } from '@workspace/ui/components/Switch'
import { api } from '@/shared/lib/api'
import { handleApiError, showCrudSuccess } from '@/shared/lib/toast'
import type { CreateDoctorScheduleRequest, UpdateDoctorScheduleRequest } from '@workspace/lib/api'

// Schedule form validation schema matching API structure
const scheduleSchema = z.object({
    doctorId: z.string({ required_error: 'Doctor is required' }),
    workDate: z.string({ required_error: 'Date is required' }),
    startTime: z.string({ required_error: 'Start time is required' }),
    endTime: z.string({ required_error: 'End time is required' }),
    location: z.string().optional(),
    notes: z.string().optional(),
    isAvailable: z.boolean().default(true),
})

type ScheduleFormData = z.infer<typeof scheduleSchema>

interface ScheduleFormModalProps {
    isOpen: boolean
    onClose: () => void
    scheduleId?: string
    doctorId: string
    initialData?: Partial<ScheduleFormData>
}

export function ScheduleFormModal({ isOpen, onClose, scheduleId, doctorId, initialData }: ScheduleFormModalProps) {
    // Component for managing doctor work schedules
    const queryClient = useQueryClient()
    const [isAvailable, setIsAvailable] = useState(initialData?.isAvailable ?? true)

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<ScheduleFormData>({
        resolver: zodResolver(scheduleSchema) as any,
        defaultValues: {
            ...initialData,
            doctorId,
            isAvailable,
        },
    })

    // Update form when initialData changes
    useEffect(() => {
        if (isOpen && initialData) {
            reset({
                ...initialData,
                doctorId,
                isAvailable: initialData.isAvailable ?? true,
            })
            setIsAvailable(initialData.isAvailable ?? true)
        }
    }, [isOpen, initialData, doctorId, reset])

    // Create schedule mutation
    const createMutation = useMutation({
        mutationFn: (data: CreateDoctorScheduleRequest) => api.doctor.createSchedule(data),
        onSuccess: () => {
            showCrudSuccess.create('Schedule')
            queryClient.invalidateQueries({ queryKey: ['doctor-schedules'] })
            queryClient.invalidateQueries({ queryKey: ['schedules'] })
            onClose()
        },
        onError: error => {
            handleApiError(error, 'Failed to create schedule')
        },
    })

    // Update schedule mutation
    const updateMutation = useMutation({
        mutationFn: (data: UpdateDoctorScheduleRequest) => api.doctor.updateSchedule(scheduleId!, data),
        onSuccess: () => {
            showCrudSuccess.update('Schedule')
            queryClient.invalidateQueries({ queryKey: ['doctor-schedules'] })
            queryClient.invalidateQueries({ queryKey: ['schedules'] })
            onClose()
        },
        onError: error => {
            handleApiError(error, 'Failed to update schedule')
        },
    })

    const onSubmit = (data: ScheduleFormData) => {
        const submitData = { ...data, isAvailable }
        if (scheduleId) {
            updateMutation.mutate(submitData)
        } else {
            createMutation.mutate(submitData)
        }
    }

    const isLoading = createMutation.isPending || updateMutation.isPending

    return (
        <DialogTrigger isOpen={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{scheduleId ? 'Edit Work Schedule' : 'Add Work Schedule'}</DialogTitle>
                    <DialogDescription>
                        {scheduleId
                            ? 'Update your work schedule details'
                            : 'Add a new work schedule for a specific date'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6 py-4">
                    {/* Work Date */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Date *</label>
                        <Input type="date" {...register('workDate')} />
                        {errors.workDate && <p className="text-red-500 text-sm mt-1">{errors.workDate.message}</p>}
                    </div>

                    {/* Work Hours */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Start Time *</label>
                            <Input type="time" {...register('startTime')} />
                            {errors.startTime && (
                                <p className="text-red-500 text-sm mt-1">{errors.startTime.message}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">End Time *</label>
                            <Input type="time" {...register('endTime')} />
                            {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime.message}</p>}
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Location (Optional)</label>
                        <Input type="text" placeholder="e.g., Room 101" {...register('location')} />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                        <Input type="text" placeholder="Additional notes" {...register('notes')} />
                    </div>

                    {/* Availability Toggle */}
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <p className="font-medium">Available for appointments</p>
                            <p className="text-sm text-muted-foreground">Allow patients to book on this date</p>
                        </div>
                        <Switch isSelected={isAvailable} onChange={setIsAvailable} />
                    </div>

                    {/* Form Actions */}
                    <DialogFooter>
                        <Button type="button" variant="outline" onPress={onClose} isDisabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" isDisabled={isLoading}>
                            {isLoading ? 'Saving...' : scheduleId ? 'Update Schedule' : 'Add Schedule'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </DialogTrigger>
    )
}
