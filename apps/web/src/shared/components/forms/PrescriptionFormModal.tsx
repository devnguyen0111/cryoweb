import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import { Textarea } from '@workspace/ui/components/Textarea'
import { Select, ListBoxItem } from '@workspace/ui/components/Select'
import { DatePicker } from '@workspace/ui/components/DatePicker'
import { api } from '@/shared/lib/api'
import { toast, handleApiError, showCrudSuccess } from '@/shared/lib/toast'
import { CalendarDate, parseDate } from '@internationalized/date'
import { Plus, Trash2, FileText, Send } from 'lucide-react'

// Medication item schema
const medicationSchema = z.object({
    name: z.string().min(1, 'Medication name is required'),
    dosage: z.string().min(1, 'Dosage is required'),
    frequency: z.string().min(1, 'Frequency is required'),
    duration: z.string().min(1, 'Duration is required'),
    instructions: z.string().optional(),
})

// Prescription form validation schema
const prescriptionSchema = z.object({
    patientId: z.number({ required_error: 'Patient is required' }),
    doctorId: z.number({ required_error: 'Doctor is required' }),
    date: z.string({ required_error: 'Date is required' }),
    diagnosis: z.string().min(1, 'Diagnosis is required'),
    medications: z.array(medicationSchema).min(1, 'At least one medication is required'),
    notes: z.string().optional(),
    status: z.enum(['draft', 'signed', 'sent']).default('draft'),
})

type PrescriptionFormData = z.infer<typeof prescriptionSchema>

interface PrescriptionFormModalProps {
    isOpen: boolean
    onClose: () => void
    prescriptionId?: number
    initialData?: Partial<PrescriptionFormData>
}

export function PrescriptionFormModal({ isOpen, onClose, prescriptionId, initialData }: PrescriptionFormModalProps) {
    const queryClient = useQueryClient()
    const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(
        initialData?.date ? parseDate(initialData.date) : null,
    )

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        setValue,
        watch,
    } = useForm<PrescriptionFormData>({
        resolver: zodResolver(prescriptionSchema) as any,
        defaultValues: {
            status: 'draft',
            medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
            ...initialData,
        },
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'medications',
    })

    // Fetch patients for selection
    const { data: patientsData } = useQuery({
        queryKey: ['patients', 'all'],
        queryFn: () => api.patient.getPatients({ page: 1, limit: 100 }),
        enabled: isOpen,
    })

    // Fetch doctors for selection
    const { data: doctorsData } = useQuery({
        queryKey: ['doctors', 'all'],
        queryFn: () => api.doctor.getDoctors({ page: 1, limit: 100 }),
        enabled: isOpen,
    })

    // NOTE: Prescription API is not yet implemented in the backend
    const createMutation = useMutation({
        mutationFn: async (data: PrescriptionFormData) => {
            throw new Error('Prescription API is not yet implemented in the backend')
        },
        onSuccess: () => {
            showCrudSuccess.create('Prescription')
            queryClient.invalidateQueries({ queryKey: ['prescriptions'] })
            onClose()
        },
        onError: error => {
            handleApiError(error, 'Failed to create prescription')
        },
    })

    const updateMutation = useMutation({
        mutationFn: async (data: PrescriptionFormData) => {
            throw new Error('Prescription API is not yet implemented in the backend')
        },
        onSuccess: () => {
            showCrudSuccess.update('Prescription')
            queryClient.invalidateQueries({ queryKey: ['prescriptions'] })
            onClose()
        },
        onError: error => {
            handleApiError(error, 'Failed to update prescription')
        },
    })

    const signMutation = useMutation({
        mutationFn: async (id: number) => {
            throw new Error('Prescription API is not yet implemented in the backend')
        },
        onSuccess: () => {
            showCrudSuccess.sign('Prescription')
            queryClient.invalidateQueries({ queryKey: ['prescriptions'] })
        },
        onError: error => {
            handleApiError(error, 'Failed to sign prescription')
        },
    })

    const sendMutation = useMutation({
        mutationFn: async (id: number) => {
            throw new Error('Prescription API is not yet implemented in the backend')
        },
        onSuccess: () => {
            showCrudSuccess.send('Prescription')
            queryClient.invalidateQueries({ queryKey: ['prescriptions'] })
        },
        onError: error => {
            handleApiError(error, 'Failed to send prescription')
        },
    })

    const onSubmit = (data: PrescriptionFormData) => {
        toast.error('Feature not available', 'Prescription management is not yet implemented')
        // if (prescriptionId) {
        //     updateMutation.mutate(data)
        // } else {
        //     createMutation.mutate(data)
        // }
    }

    const handleSign = () => {
        toast.error('Feature not available', 'Prescription signing is not yet implemented')
    }

    const handleSend = () => {
        toast.error('Feature not available', 'Prescription sending is not yet implemented')
    }

    const isLoading = createMutation.isPending || updateMutation.isPending
    const currentStatus = watch('status')

    return (
        <DialogTrigger isOpen={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{prescriptionId ? 'Edit Prescription' : 'Create New Prescription'}</DialogTitle>
                    <DialogDescription>
                        {prescriptionId
                            ? 'Update prescription details below'
                            : 'Fill in the prescription details to create a new prescription'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Patient Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Patient *</label>
                            <Select
                                placeholder="Select a patient"
                                onSelectionChange={value => setValue('patientId', Number(value))}
                                selectedKey={watch('patientId')?.toString()}
                            >
                                {patientsData?.data.map(patient => (
                                    <ListBoxItem key={patient.id} id={patient.id.toString()}>
                                        {patient.fullName}
                                    </ListBoxItem>
                                ))}
                            </Select>
                            {errors.patientId && (
                                <p className="text-red-500 text-sm mt-1">{errors.patientId.message}</p>
                            )}
                        </div>

                        {/* Doctor Selection */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Doctor *</label>
                            <Select
                                placeholder="Select a doctor"
                                onSelectionChange={value => setValue('doctorId', Number(value))}
                                selectedKey={watch('doctorId')?.toString()}
                            >
                                {doctorsData?.data.map(doctor => (
                                    <ListBoxItem key={doctor.id} id={doctor.id.toString()}>
                                        {doctor.fullName}
                                    </ListBoxItem>
                                ))}
                            </Select>
                            {errors.doctorId && <p className="text-red-500 text-sm mt-1">{errors.doctorId.message}</p>}
                        </div>
                    </div>

                    {/* Date Picker */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Date *</label>
                        <DatePicker
                            value={selectedDate}
                            onChange={date => {
                                setSelectedDate(date)
                                if (date) {
                                    setValue('date', date.toString())
                                }
                            }}
                        />
                        {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
                    </div>

                    {/* Diagnosis */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Diagnosis *</label>
                        <Textarea placeholder="Enter diagnosis..." rows={3} {...register('diagnosis')} />
                        {errors.diagnosis && <p className="text-red-500 text-sm mt-1">{errors.diagnosis.message}</p>}
                    </div>

                    {/* Medications */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <label className="block text-sm font-medium">Medications *</label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onPress={() =>
                                    append({ name: '', dosage: '', frequency: '', duration: '', instructions: '' })
                                }
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Medication
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="border rounded-lg p-4 bg-muted/30">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-sm">Medication {index + 1}</h4>
                                        {fields.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onPress={() => remove(index)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <Input
                                                placeholder="Medication name"
                                                {...register(`medications.${index}.name`)}
                                            />
                                            {errors.medications?.[index]?.name && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors.medications[index]?.name?.message}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <Input
                                                placeholder="Dosage (e.g., 500mg)"
                                                {...register(`medications.${index}.dosage`)}
                                            />
                                            {errors.medications?.[index]?.dosage && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors.medications[index]?.dosage?.message}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <Input
                                                placeholder="Frequency (e.g., 3x daily)"
                                                {...register(`medications.${index}.frequency`)}
                                            />
                                            {errors.medications?.[index]?.frequency && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors.medications[index]?.frequency?.message}
                                                </p>
                                            )}
                                        </div>

                                        <div className="col-span-2">
                                            <Input
                                                placeholder="Duration (e.g., 7 days)"
                                                {...register(`medications.${index}.duration`)}
                                            />
                                            {errors.medications?.[index]?.duration && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {errors.medications[index]?.duration?.message}
                                                </p>
                                            )}
                                        </div>

                                        <div className="col-span-2">
                                            <Textarea
                                                placeholder="Special instructions (optional)"
                                                rows={2}
                                                {...register(`medications.${index}.instructions`)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {errors.medications && (
                            <p className="text-red-500 text-sm mt-1">{errors.medications.message}</p>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Additional Notes</label>
                        <Textarea
                            placeholder="Add any additional notes or instructions..."
                            rows={3}
                            {...register('notes')}
                        />
                    </div>

                    {/* Form Actions */}
                    <DialogFooter>
                        <div className="flex items-center justify-between w-full">
                            <div className="flex gap-2">
                                {prescriptionId && currentStatus === 'draft' && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onPress={handleSign}
                                        isDisabled={signMutation.isPending}
                                    >
                                        <FileText className="h-4 w-4 mr-2" />
                                        Sign Prescription
                                    </Button>
                                )}
                                {prescriptionId && currentStatus === 'signed' && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onPress={handleSend}
                                        isDisabled={sendMutation.isPending}
                                    >
                                        <Send className="h-4 w-4 mr-2" />
                                        Send to Patient
                                    </Button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onPress={onClose} isDisabled={isLoading}>
                                    Cancel
                                </Button>
                                <Button type="submit" isDisabled={isLoading}>
                                    {isLoading
                                        ? 'Saving...'
                                        : prescriptionId
                                          ? 'Update Prescription'
                                          : 'Create Prescription'}
                                </Button>
                            </div>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </DialogTrigger>
    )
}
