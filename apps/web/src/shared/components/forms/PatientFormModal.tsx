import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
import { ListBox, Popover } from 'react-aria-components'
import { DatePicker } from '@workspace/ui/components/DatePicker'
import { api } from '@/shared/lib/api'
import type { Patient } from '@workspace/lib/api'
import { toast, handleApiError, showCrudSuccess } from '@/shared/lib/toast'
import { CalendarDate, parseDate } from '@internationalized/date'

// Patient form validation schema
const patientSchema = z
    .object({
        fullName: z.string().min(1, 'Full name is required'),
        dateOfBirth: z.string({ required_error: 'Date of birth is required' }),
        gender: z.enum(['male', 'female', 'other'], { required_error: 'Gender is required' }),
        nationality: z.string().min(1, 'Nationality is required'),
        nationalId: z.string().optional(),
        email: z.string().email('Invalid email').optional().or(z.literal('')),
        phone: z.string().min(1, 'Phone number is required'),
        address: z.string().min(1, 'Address is required'),
        bloodType: z.string().optional(),
        maritalStatus: z.string().optional(),
        occupation: z.string().optional(),
        emergencyContactName: z.string().optional(),
        emergencyContactRelationship: z.string().optional(),
        emergencyContactPhone: z.string().optional(),
        medicalHistory: z.string().optional(),
        notes: z.string().optional(),
    })
    .refine(
        data => {
            const hasAnyEmergencyContact =
                !!data.emergencyContactName || !!data.emergencyContactRelationship || !!data.emergencyContactPhone
            if (hasAnyEmergencyContact) {
                return !!data.emergencyContactName && !!data.emergencyContactPhone
            }
            return true
        },
        {
            message: 'Emergency contact name and phone are required if any emergency contact information is provided',
            path: ['emergencyContactName'],
        },
    )

type PatientFormData = z.infer<typeof patientSchema>

interface PatientFormModalProps {
    isOpen: boolean
    onClose: () => void
    patientId?: string
    initialData?: Partial<PatientFormData>
}

const bloodTypes = [
    { id: 'A+', name: 'A+' },
    { id: 'A-', name: 'A-' },
    { id: 'B+', name: 'B+' },
    { id: 'B-', name: 'B-' },
    { id: 'AB+', name: 'AB+' },
    { id: 'AB-', name: 'AB-' },
    { id: 'O+', name: 'O+' },
    { id: 'O-', name: 'O-' },
]

const maritalStatuses = [
    { id: 'single', name: 'Single' },
    { id: 'married', name: 'Married' },
    { id: 'divorced', name: 'Divorced' },
    { id: 'widowed', name: 'Widowed' },
]

const genders = [
    { id: 'male', name: 'Male' },
    { id: 'female', name: 'Female' },
    { id: 'other', name: 'Other' },
]

export function PatientFormModal({ isOpen, onClose, patientId, initialData }: PatientFormModalProps) {
    const queryClient = useQueryClient()
    const [selectedDate, setSelectedDate] = useState<CalendarDate | null>(
        initialData?.dateOfBirth ? parseDate(initialData.dateOfBirth) : null,
    )

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset,
    } = useForm<PatientFormData>({
        resolver: zodResolver(patientSchema) as any,
        defaultValues: {
            ...initialData,
        },
    })

    // Fetch patient data for editing
    const { data: patientData } = useQuery({
        queryKey: ['patient', patientId],
        queryFn: () => (patientId ? api.patient.getPatient(patientId) : null),
        enabled: !!patientId && isOpen,
    })

    // Update form when patient data is loaded
    useEffect(() => {
        if (patientData) {
            reset({
                fullName: patientData.accountInfo?.username || patientData.fullName || '',
                dateOfBirth: patientData.dateOfBirth || '',
                gender: patientData.gender || 'male',
                nationality: patientData.nationality || '',
                nationalId: patientData.nationalId || '',
                email: patientData.accountInfo?.email || patientData.email || '',
                phone: patientData.accountInfo?.phone || patientData.phone || '',
                address: patientData.accountInfo?.address || patientData.address || '',
                bloodType: patientData.bloodType || '',
                maritalStatus: patientData.maritalStatus || '',
                occupation: patientData.occupation || '',
                emergencyContactName:
                    typeof patientData.emergencyContact === 'string' ? patientData.emergencyContact : '',
                emergencyContactPhone: patientData.emergencyPhone || '',
                emergencyContactRelationship: '',
                medicalHistory: patientData.medicalHistory || '',
                notes: patientData.notes || '',
            })
            if (patientData.dateOfBirth) {
                setSelectedDate(parseDate(patientData.dateOfBirth))
            }
        }
    }, [patientData, reset])

    // Create patient mutation
    const createMutation = useMutation({
        mutationFn: (data: PatientFormData) => {
            return api.patient.createPatient({
                fullName: data.fullName,
                dateOfBirth: data.dateOfBirth,
                gender: data.gender,
                nationality: data.nationality,
                nationalId: data.nationalId,
                email: data.email || undefined,
                phone: data.phone,
                address: data.address,
                bloodType: data.bloodType,
                maritalStatus: data.maritalStatus,
                occupation: data.occupation,
                emergencyContact:
                    data.emergencyContactName && data.emergencyContactPhone
                        ? {
                              name: data.emergencyContactName,
                              relationship: data.emergencyContactRelationship || 'Unknown',
                              phone: data.emergencyContactPhone,
                          }
                        : undefined,
                medicalHistory: data.medicalHistory,
                notes: data.notes,
            })
        },
        onSuccess: () => {
            showCrudSuccess.create('Patient')
            queryClient.invalidateQueries({ queryKey: ['receptionist-patients'] })
            queryClient.invalidateQueries({ queryKey: ['patients'] })
            onClose()
            reset()
            setSelectedDate(null)
        },
        onError: error => {
            handleApiError(error, 'Failed to create patient')
        },
    })

    // Update patient mutation
    const updateMutation = useMutation({
        mutationFn: (data: PatientFormData) => {
            const updateData: any = {
                fullName: data.fullName,
                dateOfBirth: data.dateOfBirth,
                gender: data.gender,
                nationality: data.nationality,
                nationalId: data.nationalId,
                email: data.email || undefined,
                phone: data.phone,
                address: data.address,
                bloodType: data.bloodType,
                maritalStatus: data.maritalStatus,
                occupation: data.occupation,
                emergencyContact:
                    data.emergencyContactName && data.emergencyContactPhone
                        ? {
                              name: data.emergencyContactName,
                              relationship: data.emergencyContactRelationship || 'Unknown',
                              phone: data.emergencyContactPhone,
                          }
                        : undefined,
                medicalHistory: data.medicalHistory,
                notes: data.notes,
            }
            return api.patient.updatePatient(patientId!, updateData)
        },
        onSuccess: () => {
            showCrudSuccess.update('Patient')
            queryClient.invalidateQueries({ queryKey: ['patient', patientId] })
            queryClient.invalidateQueries({ queryKey: ['receptionist-patients'] })
            queryClient.invalidateQueries({ queryKey: ['patients'] })
            onClose()
        },
        onError: error => {
            handleApiError(error, 'Failed to update patient')
        },
    })

    const onSubmit = (data: PatientFormData) => {
        if (patientId) {
            updateMutation.mutate(data)
        } else {
            createMutation.mutate(data)
        }
    }

    const isLoading = createMutation.isPending || updateMutation.isPending

    return (
        <DialogTrigger isOpen={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{patientId ? 'Edit Patient' : 'Register New Patient'}</DialogTitle>
                    <DialogDescription>
                        {patientId
                            ? 'Update patient information below'
                            : 'Fill in the patient details to register a new patient'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6 py-4">
                    {/* Basic Information */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Full Name *</label>
                            <Input placeholder="Enter full name" {...register('fullName')} />
                            {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Date of Birth *</label>
                            <DatePicker
                                value={selectedDate}
                                onChange={date => {
                                    setSelectedDate(date)
                                    if (date) {
                                        setValue('dateOfBirth', date.toString())
                                    }
                                }}
                            />
                            {errors.dateOfBirth && (
                                <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Gender *</label>
                            <Select
                                placeholder="Select gender"
                                onSelectionChange={value => setValue('gender', value as 'male' | 'female' | 'other')}
                                selectedKey={watch('gender')}
                                aria-label="Select gender"
                            >
                                <Popover className="max-h-[300px] overflow-auto">
                                    <ListBox>
                                        {genders.map(gender => (
                                            <ListBoxItem key={gender.id} id={gender.id}>
                                                {gender.name}
                                            </ListBoxItem>
                                        ))}
                                    </ListBox>
                                </Popover>
                            </Select>
                            {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Nationality *</label>
                            <Input placeholder="Enter nationality" {...register('nationality')} />
                            {errors.nationality && (
                                <p className="text-red-500 text-sm mt-1">{errors.nationality.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Phone *</label>
                            <Input type="tel" placeholder="Enter phone number" {...register('phone')} />
                            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <Input type="email" placeholder="Enter email address" {...register('email')} />
                            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Address *</label>
                        <Input placeholder="Enter address" {...register('address')} />
                        {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
                    </div>

                    {/* Additional Information */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">National ID</label>
                            <Input placeholder="Enter national ID" {...register('nationalId')} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Blood Type</label>
                            <Select
                                placeholder="Select blood type"
                                onSelectionChange={value => setValue('bloodType', value as string)}
                                selectedKey={watch('bloodType') || ''}
                                aria-label="Select blood type"
                            >
                                <Popover className="max-h-[300px] overflow-auto">
                                    <ListBox>
                                        {bloodTypes.map(type => (
                                            <ListBoxItem key={type.id} id={type.id}>
                                                {type.name}
                                            </ListBoxItem>
                                        ))}
                                    </ListBox>
                                </Popover>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Marital Status</label>
                            <Select
                                placeholder="Select marital status"
                                onSelectionChange={value => setValue('maritalStatus', value as string)}
                                selectedKey={watch('maritalStatus') || ''}
                                aria-label="Select marital status"
                            >
                                <Popover className="max-h-[300px] overflow-auto">
                                    <ListBox>
                                        {maritalStatuses.map(status => (
                                            <ListBoxItem key={status.id} id={status.id}>
                                                {status.name}
                                            </ListBoxItem>
                                        ))}
                                    </ListBox>
                                </Popover>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Occupation</label>
                        <Input placeholder="Enter occupation" {...register('occupation')} />
                    </div>

                    {/* Emergency Contact */}
                    <div className="border-t pt-4">
                        <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Contact Name</label>
                                <Input placeholder="Enter contact name" {...register('emergencyContactName')} />
                                {errors.emergencyContactName && (
                                    <p className="text-red-500 text-sm mt-1">{errors.emergencyContactName.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Relationship</label>
                                <Input
                                    placeholder="e.g., Spouse, Parent"
                                    {...register('emergencyContactRelationship')}
                                />
                                {errors.emergencyContactRelationship && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.emergencyContactRelationship.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Contact Phone</label>
                                <Input
                                    type="tel"
                                    placeholder="Enter phone number"
                                    {...register('emergencyContactPhone')}
                                />
                                {errors.emergencyContactPhone && (
                                    <p className="text-red-500 text-sm mt-1">{errors.emergencyContactPhone.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Medical Information */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Medical History</label>
                        <Textarea
                            placeholder="Enter medical history or previous conditions..."
                            rows={4}
                            {...register('medicalHistory')}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Notes</label>
                        <Textarea placeholder="Additional notes..." rows={3} {...register('notes')} />
                    </div>

                    {/* Form Actions */}
                    <DialogFooter>
                        <Button type="button" variant="outline" onPress={onClose} isDisabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" isDisabled={isLoading}>
                            {isLoading ? 'Saving...' : patientId ? 'Update Patient' : 'Register Patient'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </DialogTrigger>
    )
}
