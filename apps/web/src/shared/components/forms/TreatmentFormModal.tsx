import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog } from '@workspace/ui/components/Dialog'
import { Button } from '@workspace/ui/components/Button'
import { Input } from '@workspace/ui/components/Textfield'
import { Textarea } from '@workspace/ui/components/Textarea'
import { Select } from '@workspace/ui/components/Select'
import { DatePicker } from '@workspace/ui/components/DatePicker'
import { api } from '@/shared/lib/api'
import { toast, handleApiError, showCrudSuccess } from '@/shared/lib/toast'
import { CalendarDate, parseDate } from '@internationalized/date'
import { Upload } from 'lucide-react'

// Treatment form validation schema
const treatmentSchema = z.object({
    patientId: z.number({ required_error: 'Patient is required' }),
    doctorId: z.number({ required_error: 'Doctor is required' }),
    type: z.string().min(1, 'Treatment type is required'),
    diagnosis: z.string().min(1, 'Diagnosis is required'),
    treatmentPlan: z.string().min(1, 'Treatment plan is required'),
    startDate: z.string({ required_error: 'Start date is required' }),
    endDate: z.string().optional(),
    status: z.enum(['pending', 'in-progress', 'completed', 'cancelled']).default('pending'),
    notes: z.string().optional(),
    documents: z.array(z.string()).optional(),
})

type TreatmentFormData = z.infer<typeof treatmentSchema>

interface TreatmentFormModalProps {
    isOpen: boolean
    onClose: () => void
    treatmentId?: number
    initialData?: Partial<TreatmentFormData>
}

const treatmentTypes = [
    { id: 'ivf', name: 'IVF (In Vitro Fertilization)' },
    { id: 'iui', name: 'IUI (Intrauterine Insemination)' },
    { id: 'egg-freezing', name: 'Egg Freezing' },
    { id: 'sperm-freezing', name: 'Sperm Freezing' },
    { id: 'embryo-freezing', name: 'Embryo Freezing' },
    { id: 'fertility-preservation', name: 'Fertility Preservation' },
    { id: 'consultation', name: 'Consultation' },
    { id: 'other', name: 'Other' },
]

export function TreatmentFormModal({ isOpen, onClose, treatmentId, initialData }: TreatmentFormModalProps) {
    const queryClient = useQueryClient()
    const [startDate, setStartDate] = useState<CalendarDate | null>(
        initialData?.startDate ? parseDate(initialData.startDate) : null,
    )
    const [endDate, setEndDate] = useState<CalendarDate | null>(
        initialData?.endDate ? parseDate(initialData.endDate) : null,
    )
    const [uploadedFiles, setUploadedFiles] = useState<string[]>(initialData?.documents || [])

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<TreatmentFormData>({
        resolver: zodResolver(treatmentSchema),
        defaultValues: initialData,
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

    // NOTE: Treatment API is not yet implemented in the backend
    // These mutations will cause errors until the backend API is ready
    const createMutation = useMutation({
        mutationFn: async (data: TreatmentFormData) => {
            throw new Error('Treatment API is not yet implemented in the backend')
        },
        onSuccess: () => {
            showCrudSuccess.create('Treatment')
            queryClient.invalidateQueries({ queryKey: ['treatments'] })
            onClose()
        },
        onError: error => {
            handleApiError(error, 'Failed to create treatment')
        },
    })

    const updateMutation = useMutation({
        mutationFn: async (data: TreatmentFormData) => {
            throw new Error('Treatment API is not yet implemented in the backend')
        },
        onSuccess: () => {
            showCrudSuccess.update('Treatment')
            queryClient.invalidateQueries({ queryKey: ['treatments'] })
            onClose()
        },
        onError: error => {
            handleApiError(error, 'Failed to update treatment')
        },
    })

    const onSubmit = (data: TreatmentFormData) => {
        toast.error('Feature not available', 'Treatment management is not yet implemented')
        // const submitData = { ...data, documents: uploadedFiles }
        // if (treatmentId) {
        //     updateMutation.mutate(submitData)
        // } else {
        //     createMutation.mutate(submitData)
        // }
    }

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (files) {
            // In a real implementation, upload files to server and get URLs
            const fileUrls = Array.from(files).map(file => URL.createObjectURL(file))
            setUploadedFiles([...uploadedFiles, ...fileUrls])
            toast.success('Files uploaded', `${files.length} file(s) uploaded successfully`)
        }
    }

    const isLoading = createMutation.isPending || updateMutation.isPending

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <Dialog.Content className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <Dialog.Header>
                    <Dialog.Title>{treatmentId ? 'Edit Treatment' : 'Create New Treatment'}</Dialog.Title>
                    <Dialog.Description>
                        {treatmentId
                            ? 'Update treatment details below'
                            : 'Fill in the treatment details to create a new treatment plan'}
                    </Dialog.Description>
                </Dialog.Header>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
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
                                    <Select.Item key={patient.id} id={patient.id.toString()}>
                                        {patient.fullName}
                                    </Select.Item>
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
                                    <Select.Item key={doctor.id} id={doctor.id.toString()}>
                                        {doctor.fullName}
                                    </Select.Item>
                                ))}
                            </Select>
                            {errors.doctorId && <p className="text-red-500 text-sm mt-1">{errors.doctorId.message}</p>}
                        </div>
                    </div>

                    {/* Treatment Type */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Treatment Type *</label>
                        <Select
                            placeholder="Select treatment type"
                            onSelectionChange={value => setValue('type', value as string)}
                            selectedKey={watch('type')}
                        >
                            {treatmentTypes.map(type => (
                                <Select.Item key={type.id} id={type.id}>
                                    {type.name}
                                </Select.Item>
                            ))}
                        </Select>
                        {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>}
                    </div>

                    {/* Diagnosis */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Diagnosis *</label>
                        <Textarea placeholder="Enter diagnosis details..." rows={3} {...register('diagnosis')} />
                        {errors.diagnosis && <p className="text-red-500 text-sm mt-1">{errors.diagnosis.message}</p>}
                    </div>

                    {/* Treatment Plan */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Treatment Plan *</label>
                        <Textarea
                            placeholder="Describe the treatment plan..."
                            rows={4}
                            {...register('treatmentPlan')}
                        />
                        {errors.treatmentPlan && (
                            <p className="text-red-500 text-sm mt-1">{errors.treatmentPlan.message}</p>
                        )}
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Start Date *</label>
                            <DatePicker
                                value={startDate}
                                onChange={date => {
                                    setStartDate(date)
                                    if (date) {
                                        setValue('startDate', date.toString())
                                    }
                                }}
                            />
                            {errors.startDate && (
                                <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">End Date (Optional)</label>
                            <DatePicker
                                value={endDate}
                                onChange={date => {
                                    setEndDate(date)
                                    if (date) {
                                        setValue('endDate', date.toString())
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Status</label>
                        <Select
                            onSelectionChange={value => setValue('status', value as any)}
                            selectedKey={watch('status')}
                        >
                            <Select.Item id="pending">Pending</Select.Item>
                            <Select.Item id="in-progress">In Progress</Select.Item>
                            <Select.Item id="completed">Completed</Select.Item>
                            <Select.Item id="cancelled">Cancelled</Select.Item>
                        </Select>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Documents</label>
                        <div className="border-2 border-dashed rounded-lg p-6 text-center">
                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-2">
                                Upload treatment documents, test results, or images
                            </p>
                            <input
                                type="file"
                                multiple
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload">
                                <Button type="button" variant="outline" size="sm" as="span">
                                    Choose Files
                                </Button>
                            </label>
                        </div>
                        {uploadedFiles.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {uploadedFiles.map((file, idx) => (
                                    <p key={idx} className="text-xs text-muted-foreground">
                                        • Document {idx + 1}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Additional Notes</label>
                        <Textarea
                            placeholder="Add any additional notes or observations..."
                            rows={3}
                            {...register('notes')}
                        />
                    </div>

                    {/* Form Actions */}
                    <Dialog.Footer>
                        <Button type="button" variant="outline" onPress={onClose} isDisabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" isDisabled={isLoading}>
                            {isLoading ? 'Saving...' : treatmentId ? 'Update Treatment' : 'Create Treatment'}
                        </Button>
                    </Dialog.Footer>
                </form>
            </Dialog.Content>
        </Dialog>
    )
}
