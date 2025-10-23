# Fertility Service & Cryobank Management System

## Overview

This application is a comprehensive management system for fertility clinics and cryobank facilities. It provides functionality for managing patients, biological samples, appointments, and authentication.

## Features Implemented

### 1. Home Page (`/`)

A beautiful landing page showcasing the system with:

- Hero section with call-to-action buttons
- Services section highlighting key offerings:
    - Fertility Treatment Management
    - Sample Storage & Tracking
    - Patient Records Management
    - Regulatory Compliance
    - Appointment Scheduling
    - Quality Assurance
- Features section with key capabilities
- Professional footer with links
- Responsive design for all screen sizes

### 2. Login Page (`/login`)

User authentication page with:

- Email and password fields
- Form validation using Zod schema
- Password visibility toggle
- "Forgot password" link (placeholder for future implementation)
- Link to registration page
- Error handling and loading states

### 3. Registration Page (`/register`)

New user/clinic registration with:

- Comprehensive form fields:
    - Clinic Name
    - Full Name
    - Email
    - Phone Number
    - Password with strength requirements
    - Confirm Password
- Strong password validation (min 8 chars, uppercase, lowercase, numbers)
- Form validation using Zod schema
- Terms of Service and Privacy Policy links
- Link to login page

## API Integration Structure

All API endpoints are prepared with placeholder functions that need to be replaced with actual backend calls.

### API Services (`packages/lib/src/api/`)

#### 1. Authentication API (`auth.api.ts`)

- `login(data)` - User login
- `register(data)` - New user registration
- `logout()` - User logout
- `refreshToken(refreshToken)` - Token refresh
- `getCurrentUser()` - Get current user profile
- `updateProfile(data)` - Update user profile
- `forgotPassword(data)` - Request password reset
- `resetPassword(data)` - Reset password with token
- `changePassword(data)` - Change password
- `verifyEmail(token)` - Verify email address
- `resendVerification(email)` - Resend verification email

#### 2. Patients API (`patients.api.ts`)

- `getPatients(query)` - Get paginated patient list
- `getPatient(id)` - Get single patient
- `createPatient(data)` - Create new patient
- `updatePatient(id, data)` - Update patient
- `deletePatient(id)` - Delete patient
- `archivePatient(id)` - Archive patient
- `restorePatient(id)` - Restore archived patient

#### 3. Samples API (`samples.api.ts`)

- `getSamples(query)` - Get paginated sample list
- `getSample(id)` - Get single sample
- `createSample(data)` - Create new sample record
- `updateSample(id, data)` - Update sample
- `deleteSample(id)` - Delete sample
- `getSamplesByPatient(patientId)` - Get patient's samples
- `transferSample(id, newLocation)` - Transfer sample location
- `getStorageAlerts()` - Get storage alerts
- `acknowledgeAlert(alertId)` - Acknowledge alert
- `getStorageStats()` - Get storage statistics

#### 4. Appointments API (`appointments.api.ts`)

- `getAppointments(query)` - Get paginated appointments
- `getAppointment(id)` - Get single appointment
- `createAppointment(data)` - Create new appointment
- `updateAppointment(id, data)` - Update appointment
- `cancelAppointment(id, reason)` - Cancel appointment
- `deleteAppointment(id)` - Delete appointment
- `getAvailableSlots(providerId, startDate, endDate)` - Get available time slots
- `getAppointmentsByPatient(patientId)` - Get patient's appointments
- `sendReminder(id)` - Send appointment reminder
- `getUpcomingAppointments(limit)` - Get upcoming appointments

### API Setup (`apps/web/src/shared/lib/api.ts`)

The API instance is pre-configured with:

- Base URL configuration (configurable via environment variables)
- Request interceptor for authentication tokens
- Response interceptor for error handling and token refresh
- Automatic token injection from localStorage

#### Usage Example:

```typescript
import { api } from '@/shared/lib/api'

// Login
const response = await api.auth.login({
    email: 'user@example.com',
    password: 'password123',
})

// Get patients
const patients = await api.patients.getPatients({
    page: 1,
    limit: 10,
    status: 'active',
})

// Create sample
const sample = await api.samples.createSample({
    patientId: 'patient-123',
    type: 'sperm',
    collectionDate: '2025-01-01',
    // ... other fields
})
```

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file in `apps/web/`:

```env
VITE_API_URL=http://localhost:8080/api
```

### 3. Implement Backend API

Replace all placeholder functions in the API service files with actual backend calls. Each function has a `TODO` comment indicating where to add the implementation.

**Example:**

```typescript
// Before (placeholder)
async login(data: LoginRequest): Promise<AuthResponse> {
    throw new Error('API endpoint not implemented yet. Replace with actual API call.')
}

// After (implemented)
async login(data: LoginRequest): Promise<AuthResponse> {
    return this.client.post<AuthResponse>('/auth/login', data).then(res => res.data)
}
```

### 4. Update Authentication Flow

In the login/register pages, uncomment the actual API calls and handle the responses:

**apps/web/src/routes/login.tsx:**

```typescript
const onSubmit = async (data: LoginFormData) => {
    try {
        // Uncomment and use actual API call
        const response = await api.auth.login(data.email, data.password)

        // Store tokens
        localStorage.setItem('authToken', response.token)
        localStorage.setItem('refreshToken', response.refreshToken)

        // Navigate to dashboard
        navigate({ to: '/dashboard' })
    } catch (error) {
        // Handle error
    }
}
```

### 5. Create Additional Pages

You may want to create additional pages:

- `/dashboard` - Main application dashboard
- `/patients` - Patient management
- `/samples` - Sample management
- `/appointments` - Appointment scheduling
- `/forgot-password` - Password reset flow

## Tech Stack

- **Framework**: React + Vite
- **Routing**: TanStack Router (file-based routing)
- **Forms**: React Hook Form + Zod
- **UI Components**: Custom component library (@workspace/ui)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **State Management**: TanStack Query (React Query)

## Project Structure

```
apps/web/
├── src/
│   ├── routes/           # Page routes
│   │   ├── __root.tsx    # Root layout
│   │   ├── index.tsx     # Home page
│   │   ├── login.tsx     # Login page
│   │   └── register.tsx  # Register page
│   ├── shared/
│   │   ├── components/   # Shared components
│   │   └── lib/
│   │       └── api.ts    # API instance
│   └── main.tsx          # App entry point
packages/lib/
└── src/
    └── api/
        ├── index.ts              # Main API class
        └── sdk/
            ├── auth.api.ts       # Auth endpoints
            ├── patients.api.ts   # Patient endpoints
            ├── samples.api.ts    # Sample endpoints
            └── appointments.api.ts # Appointment endpoints
```

## Running the Application

### Development Mode

```bash
cd apps/web
pnpm dev
```

The application will be available at `http://localhost:5173`

### Build for Production

```bash
cd apps/web
pnpm build
```

## Next Steps

1. **Implement Backend API**: Replace all placeholder functions with actual API calls
2. **Authentication Flow**: Implement proper authentication state management
3. **Dashboard**: Create a dashboard page for authenticated users
4. **Patient Management**: Create CRUD pages for patient management
5. **Sample Management**: Create pages for tracking and managing biological samples
6. **Appointment System**: Implement appointment scheduling interface
7. **Storage Monitoring**: Create real-time monitoring dashboard for cryogenic storage
8. **Reporting**: Add reporting and analytics features
9. **Notifications**: Implement notification system for alerts and reminders
10. **Testing**: Add unit and integration tests

## Security Considerations

- All API calls should use HTTPS in production
- Implement proper CORS configuration on the backend
- Use secure, httpOnly cookies for refresh tokens
- Implement rate limiting on authentication endpoints
- Validate all user inputs on both frontend and backend
- Use proper RBAC (Role-Based Access Control) for different user types
- Ensure HIPAA compliance for handling patient data
- Implement audit logging for all data access and modifications

## Support

For questions or issues, please refer to the main project documentation or contact the development team.
