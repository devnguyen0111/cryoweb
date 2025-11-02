import { AxiosInstance } from 'axios'
import { ExampleApi } from './sdk/example.api'
import { AuthApi } from './sdk/auth.api'
import { UserApi } from './sdk/user.api'
import { PatientApi } from './sdk/patient.api'
import { DoctorApi } from './sdk/doctor.api'
import { RelationshipApi } from './sdk/relationship.api'
import { ServiceApi } from './sdk/service.api'
import { ServiceCategoryApi } from './sdk/servicecategory.api'
import { ServiceRequestApi } from './sdk/servicerequest.api'
import { ServiceRequestDetailsApi } from './sdk/servicerequestdetails.api'
import { AppointmentsApi } from './sdk/appointments.api'
import { SlotsApi } from './sdk/slots.api'
import { DoctorSchedulesApi } from './sdk/doctorschedules.api'

/**
 * API class for the Fertility Service and Cryobank Management System
 * @example
 * const api = new Api(
 * axios.create({
        baseURL: 'http://localhost:8080/api',
        headers: {
            'Content-Type': 'application/json',
        },
    }),
 * )
 * 
 * // Usage examples:
 * api.auth.login({ email: 'user@example.com', password: 'password' })
 * api.patient.getPatients({ page: 1, limit: 10 })
 * api.doctor.getDoctorStatistics()
 * api.doctor.getSchedulesByDoctor('doctor-id-123')
 */
export class Api {
    example: ExampleApi
    auth: AuthApi
    user: UserApi
    patient: PatientApi
    doctor: DoctorApi
    relationship: RelationshipApi
    service: ServiceApi
    serviceCategory: ServiceCategoryApi
    serviceRequest: ServiceRequestApi
    serviceRequestDetails: ServiceRequestDetailsApi
    appointments: AppointmentsApi
    slots: SlotsApi
    doctorSchedules: DoctorSchedulesApi

    constructor(private readonly client: AxiosInstance) {
        this.example = new ExampleApi(this.client)
        this.auth = new AuthApi(this.client)
        this.user = new UserApi(this.client)
        this.patient = new PatientApi(this.client)
        this.doctor = new DoctorApi(this.client)
        this.relationship = new RelationshipApi(this.client)
        this.service = new ServiceApi(this.client)
        this.serviceCategory = new ServiceCategoryApi(this.client)
        this.serviceRequest = new ServiceRequestApi(this.client)
        this.serviceRequestDetails = new ServiceRequestDetailsApi(this.client)
        this.appointments = new AppointmentsApi(this.client)
        this.slots = new SlotsApi(this.client)
        this.doctorSchedules = new DoctorSchedulesApi(this.client)
    }
}

// Export all types
export * from './sdk/auth.api'
export * from './sdk/user.api'
export * from './sdk/patient.api'
export * from './sdk/doctor.api'
export * from './sdk/relationship.api'
export * from './sdk/service.api'
export * from './sdk/servicecategory.api'
export * from './sdk/servicerequest.api'
export * from './sdk/servicerequestdetails.api'
export * from './sdk/slots.api'
export * from './sdk/doctorschedules.api'
export type {
    Appointment,
    CreateAppointmentRequest,
    UpdateAppointmentRequest,
    AppointmentListQuery,
    AppointmentListResponse,
} from './sdk/appointments.api'
export type { TimeSlot as AppointmentTimeSlot } from './sdk/appointments.api'
