# API Usage Examples

This document provides practical examples of how to use the API services in your React components.

## Basic Usage

### 1. Authentication

#### Login Example

```typescript
import { api } from '@/shared/lib/api'
import { toast } from '@workspace/ui/components/Sonner'
import { useNavigate } from '@tanstack/react-router'

function LoginComponent() {
    const navigate = useNavigate()

    const handleLogin = async (email: string, password: string) => {
        try {
            const response = await api.auth.login({ email, password })

            // Store tokens
            localStorage.setItem('authToken', response.token)
            localStorage.setItem('refreshToken', response.refreshToken)

            toast.success({
                title: 'Login successful',
                description: `Welcome back, ${response.user.fullName}!`,
            })

            navigate({ to: '/dashboard' })
        } catch (error) {
            toast.error({
                title: 'Login failed',
                description: 'Invalid credentials',
            })
        }
    }
}
```

#### Register Example

```typescript
const handleRegister = async (data: RegisterFormData) => {
    try {
        const response = await api.auth.register({
            clinicName: data.clinicName,
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            password: data.password,
        })

        localStorage.setItem('authToken', response.token)
        localStorage.setItem('refreshToken', response.refreshToken)

        toast.success({
            title: 'Registration successful',
            description: 'Please check your email for verification.',
        })

        navigate({ to: '/verify-email' })
    } catch (error) {
        toast.error({
            title: 'Registration failed',
            description: error.response?.data?.message || 'An error occurred',
        })
    }
}
```

### 2. Using with React Query

#### Fetch Patients List

```typescript
import { useQuery } from '@tanstack/react-query'
import { api } from '@/shared/lib/api'

function PatientsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['patients', { page: 1, limit: 10 }],
    queryFn: () => api.patients.getPatients({ page: 1, limit: 10, status: 'active' })
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading patients</div>

  return (
    <div>
      {data?.data.map(patient => (
        <div key={patient.id}>
          {patient.firstName} {patient.lastName}
        </div>
      ))}
    </div>
  )
}
```

#### Fetch Single Patient

```typescript
import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'

function PatientDetailPage() {
  const { id } = useParams()

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => api.patients.getPatient(id)
  })

  if (isLoading) return <div>Loading patient...</div>

  return (
    <div>
      <h1>{patient.firstName} {patient.lastName}</h1>
      <p>Email: {patient.email}</p>
      <p>Phone: {patient.phone}</p>
    </div>
  )
}
```

#### Create Patient (Mutation)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/shared/lib/api'
import { toast } from '@workspace/ui/components/Sonner'

function CreatePatientForm() {
  const queryClient = useQueryClient()

  const createPatientMutation = useMutation({
    mutationFn: (data: CreatePatientRequest) => api.patients.createPatient(data),
    onSuccess: () => {
      // Invalidate and refetch patients list
      queryClient.invalidateQueries({ queryKey: ['patients'] })

      toast.success({
        title: 'Patient created',
        description: 'Patient record has been successfully created.'
      })
    },
    onError: (error) => {
      toast.error({
        title: 'Failed to create patient',
        description: error.message
      })
    }
  })

  const handleSubmit = (formData: CreatePatientRequest) => {
    createPatientMutation.mutate(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={createPatientMutation.isPending}>
        {createPatientMutation.isPending ? 'Creating...' : 'Create Patient'}
      </button>
    </form>
  )
}
```

### 3. Samples Management

#### Fetch Samples

```typescript
function SamplesPage() {
  const [filters, setFilters] = useState({ type: 'all', status: 'stored' })

  const { data: samplesData } = useQuery({
    queryKey: ['samples', filters],
    queryFn: () => api.samples.getSamples({
      page: 1,
      limit: 20,
      type: filters.type !== 'all' ? filters.type : undefined,
      status: filters.status
    })
  })

  return (
    <div>
      {/* Filter controls */}
      <select onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
        <option value="all">All Types</option>
        <option value="sperm">Sperm</option>
        <option value="egg">Egg</option>
        <option value="embryo">Embryo</option>
      </select>

      {/* Samples list */}
      {samplesData?.data.map(sample => (
        <div key={sample.id}>
          <h3>Sample ID: {sample.id}</h3>
          <p>Type: {sample.type}</p>
          <p>Status: {sample.status}</p>
          <p>Location: Tank {sample.storageLocation.tank}</p>
        </div>
      ))}
    </div>
  )
}
```

#### Transfer Sample

```typescript
function TransferSampleDialog({ sampleId }: { sampleId: string }) {
  const queryClient = useQueryClient()

  const transferMutation = useMutation({
    mutationFn: (newLocation: any) =>
      api.samples.transferSample(sampleId, newLocation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['samples'] })
      queryClient.invalidateQueries({ queryKey: ['sample', sampleId] })

      toast.success({
        title: 'Sample transferred',
        description: 'Sample has been moved to new location.'
      })
    }
  })

  const handleTransfer = (location: any) => {
    transferMutation.mutate(location)
  }

  return (
    <div>
      {/* Transfer form */}
    </div>
  )
}
```

### 4. Appointments

#### Fetch Upcoming Appointments

```typescript
function DashboardWidget() {
  const { data: upcomingAppointments } = useQuery({
    queryKey: ['appointments', 'upcoming'],
    queryFn: () => api.appointments.getUpcomingAppointments(5),
    refetchInterval: 60000 // Refetch every minute
  })

  return (
    <div className="card">
      <h3>Upcoming Appointments</h3>
      {upcomingAppointments?.map(apt => (
        <div key={apt.id}>
          <p>{apt.title}</p>
          <p>{apt.date} at {apt.startTime}</p>
          <p>Provider: {apt.provider.name}</p>
        </div>
      ))}
    </div>
  )
}
```

#### Create Appointment

```typescript
function CreateAppointmentForm() {
  const queryClient = useQueryClient()

  const createAppointmentMutation = useMutation({
    mutationFn: (data: CreateAppointmentRequest) =>
      api.appointments.createAppointment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })

      toast.success({
        title: 'Appointment scheduled',
        description: 'The appointment has been successfully created.'
      })
    }
  })

  return (
    // Form implementation
  )
}
```

#### Cancel Appointment

```typescript
function CancelAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const queryClient = useQueryClient()

  const cancelMutation = useMutation({
    mutationFn: (reason: string) =>
      api.appointments.cancelAppointment(appointmentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })

      toast.success({
        title: 'Appointment cancelled',
        description: 'The appointment has been cancelled.'
      })
    }
  })

  const handleCancel = () => {
    const reason = prompt('Reason for cancellation:')
    if (reason) {
      cancelMutation.mutate(reason)
    }
  }

  return (
    <button onClick={handleCancel} disabled={cancelMutation.isPending}>
      Cancel Appointment
    </button>
  )
}
```

### 5. Storage Alerts

#### Fetch and Display Alerts

```typescript
function StorageAlertsWidget() {
  const queryClient = useQueryClient()

  const { data: alerts } = useQuery({
    queryKey: ['storage-alerts'],
    queryFn: () => api.samples.getStorageAlerts(),
    refetchInterval: 30000 // Check every 30 seconds
  })

  const acknowledgeMutation = useMutation({
    mutationFn: (alertId: string) => api.samples.acknowledgeAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-alerts'] })
    }
  })

  const criticalAlerts = alerts?.filter(a => a.severity === 'critical')

  return (
    <div className="alerts">
      {criticalAlerts?.length > 0 && (
        <div className="critical-alerts">
          <h3>⚠️ Critical Alerts</h3>
          {criticalAlerts.map(alert => (
            <div key={alert.id} className="alert critical">
              <p>{alert.message}</p>
              <button onClick={() => acknowledgeMutation.mutate(alert.id)}>
                Acknowledge
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

### 6. Storage Statistics

#### Dashboard Statistics

```typescript
function StorageStatsCard() {
  const { data: stats } = useQuery({
    queryKey: ['storage-stats'],
    queryFn: () => api.samples.getStorageStats(),
    refetchInterval: 60000
  })

  const usagePercentage = stats
    ? (stats.capacityUsed / stats.capacityTotal) * 100
    : 0

  return (
    <div className="stats-card">
      <h3>Storage Overview</h3>
      <p>Total Samples: {stats?.totalSamples}</p>
      <p>Capacity Used: {usagePercentage.toFixed(1)}%</p>

      <div className="samples-by-type">
        {Object.entries(stats?.byType || {}).map(([type, count]) => (
          <div key={type}>
            <span>{type}:</span>
            <span>{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 7. Pagination Example

#### Paginated Patients List

```typescript
function PatientsTable() {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  const { data, isLoading } = useQuery({
    queryKey: ['patients', { page, limit }],
    queryFn: () => api.patients.getPatients({ page, limit }),
    keepPreviousData: true // Keep showing old data while fetching new
  })

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data?.data.map(patient => (
            <tr key={patient.id}>
              <td>{patient.firstName} {patient.lastName}</td>
              <td>{patient.email}</td>
              <td>{patient.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>Page {page} of {data?.totalPages}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={page >= (data?.totalPages || 1)}
        >
          Next
        </button>
      </div>
    </div>
  )
}
```

## Error Handling

### Global Error Handler

```typescript
// Already implemented in apps/web/src/shared/lib/api.ts
// The axios interceptor automatically handles:
// - 401 errors (unauthorized - triggers token refresh)
// - Network errors
// - Timeout errors
```

### Component-level Error Handling

```typescript
function PatientDetail({ id }: { id: string }) {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => api.patients.getPatient(id),
    retry: 2 // Retry failed requests 2 times
  })

  if (isLoading) return <Spinner />

  if (error) {
    return (
      <div className="error">
        <p>Failed to load patient</p>
        <button onClick={() => refetch()}>Try Again</button>
      </div>
    )
  }

  return <div>{/* Patient details */}</div>
}
```

## Advanced Patterns

### Optimistic Updates

```typescript
function UpdatePatientStatus({ patientId }: { patientId: string }) {
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: (status: string) =>
      api.patients.updatePatient(patientId, { status }),

    // Optimistically update the UI before the request completes
    onMutate: async (newStatus) => {
      await queryClient.cancelQueries({ queryKey: ['patient', patientId] })

      const previousPatient = queryClient.getQueryData(['patient', patientId])

      queryClient.setQueryData(['patient', patientId], (old: any) => ({
        ...old,
        status: newStatus
      }))

      return { previousPatient }
    },

    // Revert on error
    onError: (err, newStatus, context) => {
      queryClient.setQueryData(
        ['patient', patientId],
        context.previousPatient
      )

      toast.error({
        title: 'Update failed',
        description: 'Could not update patient status'
      })
    },

    // Refetch after success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', patientId] })
    }
  })

  return (
    <select onChange={(e) => updateMutation.mutate(e.target.value)}>
      <option value="active">Active</option>
      <option value="inactive">Inactive</option>
      <option value="archived">Archived</option>
    </select>
  )
}
```

### Infinite Scroll

```typescript
import { useInfiniteQuery } from '@tanstack/react-query'

function InfiniteSamplesList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['samples', 'infinite'],
    queryFn: ({ pageParam = 1 }) =>
      api.samples.getSamples({ page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1
      }
      return undefined
    }
  })

  return (
    <div>
      {data?.pages.map((page, i) => (
        <React.Fragment key={i}>
          {page.data.map(sample => (
            <div key={sample.id}>{/* Sample card */}</div>
          ))}
        </React.Fragment>
      ))}

      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  )
}
```

## Testing Examples

### Mock API for Testing

```typescript
// __tests__/mocks/api.ts
import { vi } from 'vitest'

export const mockApi = {
    auth: {
        login: vi.fn(),
        register: vi.fn(),
    },
    patients: {
        getPatients: vi.fn(),
        getPatient: vi.fn(),
        createPatient: vi.fn(),
    },
}

// In your test file
import { mockApi } from './__mocks__/api'

test('login success', async () => {
    mockApi.auth.login.mockResolvedValue({
        token: 'fake-token',
        user: { id: '1', email: 'test@example.com' },
    })

    // Your test code
})
```

## Tips

1. **Always use React Query** for data fetching - it provides caching, refetching, and optimistic updates
2. **Handle loading states** - Show spinners or skeletons while data is loading
3. **Handle errors gracefully** - Show user-friendly error messages
4. **Use TypeScript** - The API is fully typed, take advantage of it
5. **Invalidate queries** - After mutations, invalidate related queries to refetch fresh data
6. **Use toast notifications** - Provide feedback for user actions
7. **Implement retry logic** - Network requests can fail, implement retry mechanisms
8. **Cache appropriately** - Set appropriate `staleTime` for different types of data

## Resources

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [React Hook Form Docs](https://react-hook-form.com/)
- [Zod Docs](https://zod.dev/)
- [Axios Docs](https://axios-http.com/)
