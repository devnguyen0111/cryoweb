import { AxiosInstance } from 'axios'
import { ExampleApi } from './sdk/example.api'
import { AuthApi } from './sdk/auth.api'
import { UserApi } from './sdk/user.api'
import { PatientsApi } from './sdk/patients.api'
import { SamplesApi } from './sdk/samples.api'
import { AppointmentsApi } from './sdk/appointments.api'

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
 * api.patients.getPatients({ page: 1, limit: 10 })
 * api.samples.getSamples({ status: 'stored' })
 * api.appointments.getUpcomingAppointments()
 */
export class Api {
    example: ExampleApi
    auth: AuthApi
    user: UserApi
    patients: PatientsApi
    samples: SamplesApi
    appointments: AppointmentsApi

    constructor(private readonly client: AxiosInstance) {
        this.example = new ExampleApi(this.client)
        this.auth = new AuthApi(this.client)
        this.user = new UserApi(this.client)
        this.patients = new PatientsApi(this.client)
        this.samples = new SamplesApi(this.client)
        this.appointments = new AppointmentsApi(this.client)
    }
}

// Export all types
export * from './sdk/auth.api'
export type { User as UserDto } from './sdk/user.api'
export * from './sdk/patients.api'
export * from './sdk/samples.api'
export * from './sdk/appointments.api'
