# Architecture Overview - Front-End

## 📐 Kiến Trúc Tổng Quan (Architecture Diagram)

```mermaid
graph TB
    subgraph "Monorepo Structure"
        Root[🏠 CryoWeb Root<br/>Turborepo + pnpm]

        subgraph "Applications Layer"
            WebApp[🏥 Web App<br/>Fertility Management System<br/>Vite + React 19]
        end

        subgraph "Shared Packages"
            UI[🎨 @workspace/ui<br/>UI Component Library<br/>React Aria + Tailwind CSS]
            Lib[📦 @workspace/lib<br/>Business Logic & API SDK<br/>TypeScript]
            TSConfig[⚙️ @workspace/typescript-config<br/>Shared TS Configurations]
            ESLintConfig[✅ @workspace/eslint-config<br/>Shared ESLint Rules]
        end

        Root --> WebApp
        Root --> UI
        Root --> Lib
        Root --> TSConfig
        Root --> ESLintConfig

        WebApp --> UI
        WebApp --> Lib
        WebApp --> TSConfig
        WebApp --> ESLintConfig
    end
```

## 🏗️ Web Application Architecture (apps/web)

```mermaid
graph TB
    subgraph "Web Application Structure"
        Entry["main.tsx - Application Entry Point"]

        subgraph "Routing Layer"
            Router["TanStack Router - File-based Routing"]
            Root["__root.tsx - Root Layout + Providers"]

            subgraph "Public Routes"
                Home["index.tsx - Home Page"]
                Login["login.tsx - Login Page"]
                Register["register.tsx - Registration"]
            end

            subgraph "Protected Routes"
                Dashboard["dashboard.tsx - Statistics"]
                Patients["patients.tsx - Patient Management"]
                Samples["samples.tsx - Sample Tracking"]
                Appointments["appointments.tsx - Scheduling"]
                Settings["settings.tsx - User Settings"]
                
                subgraph "Admin Routes"
                    AdminDash["admin/dashboard.tsx"]
                    AdminUsers["admin/users.tsx"]
                    AdminPatients["admin/patients.tsx"]
                    AdminSamples["admin/samples.tsx"]
                    AdminAppointments["admin/appointments.tsx"]
                    AdminReports["admin/reports.tsx"]
                    AdminCategories["admin/categories.tsx"]
                    AdminContent["admin/content.tsx"]
                    AdminSettings["admin/settings.tsx"]
                end
                
                subgraph "Doctor Routes"
                    DoctorDash["doctor/index.tsx"]
                    DoctorPatients["doctor/patients.tsx"]
                    DoctorAppointments["doctor/appointments.tsx"]
                    DoctorSchedule["doctor/schedule.tsx"]
                    DoctorEncounters["doctor/encounter.tsx"]
                    DoctorPrescriptions["doctor/prescriptions.tsx"]
                    DoctorReports["doctor/reports.tsx"]
                    DoctorLabSamples["doctor/lab-samples.tsx"]
                    DoctorTreatments["doctor/treatments.tsx"]
                    DoctorServiceRequests["doctor/service-requests.tsx"]
                end
                
                subgraph "Receptionist Routes"
                    ReceptionistDash["receptionist/index.tsx"]
                    ReceptionistPatients["receptionist/patients.tsx"]
                    ReceptionistAppointments["receptionist/appointments.tsx"]
                    ReceptionistServices["receptionist/services.tsx"]
                    ReceptionistReports["receptionist/reports.tsx"]
                    ReceptionistTransactions["receptionist/transactions.tsx"]
                end
                
                subgraph "Lab Technician Routes"
                    LabDash["lab/dashboard.tsx"]
                    LabSamples["lab-technician/samples.tsx"]
                    LabTests["lab-technician/tests.tsx"]
                end
            end
        end

        subgraph "State Management"
            ReactQuery["TanStack Query - Server State"]
            ReactHookForm["React Hook Form - Form State"]
        end

        subgraph "Shared Layer"
            Components["Shared Components"]
            ApiClient["API Client - Axios"]
            AuthContext["AuthContext - Authentication State"]
            RoleGuard["RoleGuard & RoleBasedRoute - RBAC"]
            ThemeProvider["ThemeProvider - Dark/Light Mode"]
            ExportUtils["Export Utils - PDF/Excel"]
        end

        Entry --> Router
        Router --> Root
        Root --> Home
        Root --> Login
        Root --> Register
        Root --> Dashboard
        Root --> Patients
        Root --> Samples
        Root --> Appointments
        Root --> Settings

        Dashboard --> ReactQuery
        Patients --> ReactQuery
        Samples --> ReactQuery
        Appointments --> ReactQuery

        Login --> ReactHookForm
        Register --> ReactHookForm

        ReactQuery --> ApiClient
        Root --> Components
        Components --> ApiClient
    end
```

## 📦 Packages Architecture

```mermaid
graph TB
    subgraph LibPackage["@workspace/lib Package"]
        LibIndex["index.ts - Main Export"]

        subgraph "API SDK (13 Modules)"
            AuthAPI["auth.api.ts - Authentication"]
            UserAPI["user.api.ts - User Management"]
            PatientAPI["patient.api.ts - Patient CRUD"]
            PatientsAPI["patients.api.ts - Patients List"]
            DoctorAPI["doctor.api.ts - Doctor Operations"]
            RelationshipAPI["relationship.api.ts - Relationships"]
            ServiceAPI["service.api.ts - Services"]
            ServiceCategoryAPI["servicecategory.api.ts - Categories"]
            ServiceRequestAPI["servicerequest.api.ts - Service Requests"]
            ServiceRequestDetailsAPI["servicerequestdetails.api.ts - Request Details"]
            AppointmentsAPI["appointments.api.ts - Scheduling"]
            SamplesAPI["samples.api.ts - Sample Management"]
            ExampleAPI["example.api.ts - Examples"]
        end

        subgraph "Validation"
            ValidationSchemas["Zod Schemas - Validation"]
        end

        LibIndex --> AuthAPI
        LibIndex --> UserAPI
        LibIndex --> PatientAPI
        LibIndex --> PatientsAPI
        LibIndex --> DoctorAPI
        LibIndex --> RelationshipAPI
        LibIndex --> ServiceAPI
        LibIndex --> ServiceCategoryAPI
        LibIndex --> ServiceRequestAPI
        LibIndex --> ServiceRequestDetailsAPI
        LibIndex --> AppointmentsAPI
        LibIndex --> SamplesAPI
        LibIndex --> ExampleAPI
        LibIndex --> ValidationSchemas
    end

    subgraph UIPackage["@workspace/ui Package"]
        UIIndex["Component Exports"]

        subgraph "Form Components"
            Button["Button - 10+ Variants"]
            Input["Input Fields"]
            Select["Select Components"]
            Form["Form Wrappers"]
        end

        subgraph "Data Display"
            DataTable["DataTable - Sortable"]
            Card["Card Components"]
            Badge["Badge & Avatar"]
            Calendar["Calendar & DatePicker"]
        end

        subgraph "Layout Components"
            Dialog["Dialog & Sheet"]
            Sidebar["Sidebar Navigation"]
            Menu["Menu & Popover"]
            Tabs["Tabs & Accordion"]
        end

        subgraph "Feedback Components"
            Toast["Sonner Toasts"]
            Progress["Progress & Spinner"]
            NProgress["NProgress Bar"]
        end

        subgraph "Utilities"
            Provider["React Aria Provider"]
            Hooks["Custom Hooks"]
            Utils["Utility Functions"]
        end

        UIIndex --> Button
        UIIndex --> Input
        UIIndex --> Select
        UIIndex --> Form
        UIIndex --> DataTable
        UIIndex --> Card
        UIIndex --> Badge
        UIIndex --> Calendar
        UIIndex --> Dialog
        UIIndex --> Sidebar
        UIIndex --> Menu
        UIIndex --> Tabs
        UIIndex --> Toast
        UIIndex --> Progress
        UIIndex --> NProgress
        UIIndex --> Provider
        UIIndex --> Hooks
        UIIndex --> Utils
    end
```

## 🔄 Data Flow Architecture

```mermaid
sequenceDiagram
    participant User
    participant UI as UI Components
    participant Page as Page Component
    participant Query as TanStack Query
    participant API as API SDK
    participant Axios as Axios Client
    participant Backend as Backend API

    User->>UI: Interact - Click, Submit
    UI->>Page: Event Handler
    Page->>Query: Trigger Query/Mutation
    Query->>API: Call SDK Method
    API->>Axios: HTTP Request

    alt Authentication Required
        Axios->>Axios: Add JWT Token via Interceptor
    end

    Axios->>Backend: API Call
    Backend-->>Axios: Response

    alt Token Expired - 401
        Axios->>Backend: Refresh Token
        Backend-->>Axios: New Token
        Axios->>Backend: Retry Original Request
        Backend-->>Axios: Response
    end

    Axios-->>API: Response Data
    API-->>Query: Typed Data
    Query-->>Page: Update State
    Page-->>UI: Re-render
    UI-->>User: Updated View
```

## 🎨 Component Architecture

```mermaid
graph TB
    subgraph "Component Hierarchy"
        AppRoot["App Root - Providers & Theme"]

        subgraph "Layout Components"
            RootLayout["Root Layout - Navigation"]
            AppLayout["App Layout - Protected Routes"]
        end

        subgraph "Page Components"
            PageComponent["Page Component - Dashboard, Patients"]

            subgraph "Feature Components"
                FeatureSection["Feature Section - Logical Group"]

                subgraph "UI Components"
                    UIComp["Workspace UI - Button, Card, Form"]
                    CustomComp["Custom Components - Domain-specific"]
                end
            end
        end

        AppRoot --> RootLayout
        RootLayout --> AppLayout
        AppLayout --> PageComponent
        PageComponent --> FeatureSection
        FeatureSection --> UIComp
        FeatureSection --> CustomComp
    end
```

## 🛠️ Technology Stack

```mermaid
graph TB
    subgraph "Core Technologies"
        React["React 19 - UI Library"]
        TS["TypeScript - Type Safety"]
        Vite["Vite - Build Tool"]
    end

    subgraph "Routing & State"
        Router["TanStack Router - File-based"]
        Query["TanStack Query - Server State"]
        RHF["React Hook Form - Form State"]
    end

    subgraph "UI & Styling"
        RAC["React Aria Components"]
        Tailwind["Tailwind CSS"]
        Lucide["Lucide React - Icons"]
    end

    subgraph "Data & Validation"
        Axios["Axios - HTTP Client"]
        Zod["Zod - Schema Validation"]
    end

    subgraph "Dev Tools"
        Turbo["Turborepo - Monorepo"]
        ESLint["ESLint - Linting"]
        Prettier["Prettier - Formatting"]
        pnpm["pnpm - Package Manager"]
    end
```

## 📂 File Structure Details

### Web App Structure (apps/web)

```
apps/web/
├── src/
│   ├── main.tsx                    # Entry point
│   ├── routeTree.gen.ts           # Generated route tree
│   │
│   ├── routes/                     # File-based routing (40+ routes)
│   │   ├── __root.tsx             # Root layout + providers
│   │   ├── index.tsx              # Home page (/)
│   │   ├── login.tsx              # Login page (/login)
│   │   ├── forgot-password.tsx    # Password recovery
│   │   ├── dashboard.tsx          # General dashboard
│   │   ├── patients.tsx           # Patient listing
│   │   ├── samples.tsx            # Sample listing
│   │   ├── appointments.tsx       # Appointment listing
│   │   ├── settings.tsx           # User settings
│   │   ├── about.tsx             # About page
│   │   ├── contact.tsx           # Contact page
│   │   ├── features.tsx          # Features page
│   │   ├── pricing.tsx           # Pricing page
│   │   ├── careers.tsx           # Careers page
│   │   ├── security.tsx          # Security page
│   │   ├── services.tsx          # Services listing
│   │   ├── services/             # Service detail pages
│   │   │   ├── index.tsx
│   │   │   ├── ivf.tsx
│   │   │   ├── iui.tsx
│   │   │   ├── egg-freezing.tsx
│   │   │   ├── embryo-freezing.tsx
│   │   │   ├── fertility-preservation.tsx
│   │   │   └── male-fertility.tsx
│   │   ├── admin/                # Admin routes
│   │   │   ├── dashboard.tsx
│   │   │   ├── users.tsx
│   │   │   ├── patients.tsx
│   │   │   ├── samples.tsx
│   │   │   ├── appointments.tsx
│   │   │   ├── reports.tsx
│   │   │   ├── categories.tsx
│   │   │   ├── content.tsx
│   │   │   └── settings.tsx
│   │   ├── doctor/               # Doctor routes
│   │   │   ├── index.tsx
│   │   │   ├── patients.tsx
│   │   │   ├── appointments.tsx
│   │   │   ├── schedule.tsx
│   │   │   ├── encounter.tsx
│   │   │   ├── prescriptions.tsx
│   │   │   ├── reports.tsx
│   │   │   ├── lab-samples.tsx
│   │   │   ├── treatments.tsx
│   │   │   └── service-requests.tsx
│   │   ├── receptionist/         # Receptionist routes
│   │   │   ├── index.tsx
│   │   │   ├── patients.tsx
│   │   │   ├── appointments.tsx
│   │   │   ├── services.tsx
│   │   │   ├── reports.tsx
│   │   │   └── transactions.tsx
│   │   ├── lab-technician/       # Lab Technician routes
│   │   │   ├── samples.tsx
│   │   │   └── tests.tsx
│   │   ├── lab/                  # Lab routes
│   │   │   └── dashboard.tsx
│   │   ├── admin.tsx             # Admin layout
│   │   ├── doctor.tsx            # Doctor layout
│   │   ├── receptionist.tsx      # Receptionist layout
│   │   ├── lab-technician.tsx    # Lab Technician layout
│   │   └── unauthorized.tsx     # Unauthorized page
│   │
│   └── shared/
│       ├── components/            # Shared components
│       │   ├── AppLayout.tsx     # App layout wrapper
│       │   ├── Providers.tsx     # Context providers (Query, Router)
│       │   ├── ProtectedRoute.tsx # Route protection
│       │   ├── RoleBasedRoute.tsx # Role-based routing
│       │   ├── RoleGuard.tsx     # Permission guards
│       │   ├── ThemeProvider.tsx # Theme context
│       │   ├── ThemeSwitcher.tsx # Theme toggle
│       │   ├── dashboard/        # Dashboard components
│       │   │   ├── DashboardLayout.tsx
│       │   │   ├── DashboardCard.tsx
│       │   │   ├── StatCard.tsx
│       │   │   └── Sidebar.tsx
│       │   └── forms/            # Form modals
│       │       ├── AppointmentFormModal.tsx
│       │       ├── PrescriptionFormModal.tsx
│       │       ├── ScheduleFormModal.tsx
│       │       └── TreatmentFormModal.tsx
│       ├── contexts/
│       │   └── AuthContext.tsx   # Authentication context
│       ├── layouts/
│       │   └── DashboardLayout.tsx # Reusable dashboard layout
│       ├── lib/
│       │   ├── api.ts            # Axios instance + interceptors
│       │   ├── export.ts         # PDF/Excel export utilities
│       │   └── toast.ts          # Toast notifications
│       ├── types/
│       │   └── auth.ts           # Auth types & role permissions
│       └── utils/
│           ├── roleUtils.ts      # Role utility functions
│           ├── api-test.ts       # API testing utilities
│           └── debug-auth.ts    # Auth debugging
│
├── package.json
├── vite.config.js
└── tsconfig.json
```

### UI Package Structure (packages/ui)

```
packages/ui/
├── src/
│   ├── components/                # All UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Form.tsx
│   │   ├── DataTable.tsx
│   │   ├── Dialog.tsx
│   │   ├── Calendar.tsx
│   │   ├── Sidebar.tsx
│   │   └── ... (50+ components)
│   │
│   ├── hooks/                     # Custom hooks
│   │   └── use-mobile.ts
│   │
│   ├── lib/                       # Utilities
│   │   ├── utils.ts              # cn() and helpers
│   │   └── file.ts               # File utilities
│   │
│   └── styles/
│       └── globals.css           # Global styles + Tailwind
│
├── components.json                # shadcn/ui config
├── package.json
└── tsconfig.json
```

### Lib Package Structure (packages/lib)

```
packages/lib/
├── src/
│   ├── api/
│   │   ├── index.ts              # Main API class
│   │   └── sdk/                  # API endpoints (13 modules)
│   │       ├── auth.api.ts       # Authentication API
│   │       ├── user.api.ts       # User Management API
│   │       ├── patient.api.ts   # Patient CRUD API
│   │       ├── patients.api.ts  # Patients List API
│   │       ├── doctor.api.ts    # Doctor Operations API
│   │       ├── relationship.api.ts # Relationship API
│   │       ├── service.api.ts   # Service API
│   │       ├── servicecategory.api.ts # Service Category API
│   │       ├── servicerequest.api.ts # Service Request API
│   │       ├── servicerequestdetails.api.ts # Request Details API
│   │       ├── appointments.api.ts # Appointments API
│   │       ├── samples.api.ts   # Samples API
│   │       └── example.api.ts   # Example API
│   │
│   └── validation/
│       └── index.ts              # Zod validation schemas
│
├── package.json
└── tsconfig.json
```

## 🔐 Security Architecture

```mermaid
graph TB
    subgraph "Security Layers"
        User["User"]

        subgraph "Frontend Security"
            FormValidation["Form Validation - Zod Schemas"]
            XSSPrevention["XSS Prevention - React"]
            CSRFToken["CSRF Token - Headers"]
            RouteGuard["Route Protection - RoleBasedRoute"]
            PermissionGuard["Permission Guard - RoleGuard"]
        end

        subgraph "Authentication Flow"
            Login["Login Form"]
            AuthContext["AuthContext - State Management"]
            JWT["JWT Token - Access & Refresh"]
            Storage["LocalStorage - Token Storage"]
            Interceptor["Axios Interceptor"]
            RefreshLogic["Token Refresh - On 401"]
        end

        subgraph "Authorization"
            RoleCheck["Role-Based Access Control"]
            PermissionCheck["Permission-Based Access"]
            RoleUtils["Role Utilities - roleUtils.ts"]
            DefaultRoutes["Default Routes by Role"]
        end

        subgraph "Backend API"
            AuthGuard["Authentication Guard"]
            RBAC["Role-Based Access Control"]
            DataValidation["Server-side Validation"]
        end

        User --> FormValidation
        FormValidation --> Login
        Login --> AuthContext
        AuthContext --> JWT
        JWT --> Storage
        Storage --> Interceptor
        Interceptor --> RouteGuard
        RouteGuard --> RoleCheck
        RoleCheck --> PermissionGuard
        PermissionGuard --> PermissionCheck
        PermissionCheck --> RoleUtils
        RoleUtils --> DefaultRoutes
        
        RouteGuard --> AuthGuard
        AuthGuard -->|401| RefreshLogic
        RefreshLogic --> JWT

        AuthGuard -->|Authorized| RBAC
        RBAC --> DataValidation
    end
```

### Role-Based Access Control (RBAC)

The system implements comprehensive role-based access control with 4 distinct user roles:

| Role             | Dashboard Route            | Key Permissions                                    |
| ---------------- | -------------------------- | -------------------------------------------------- |
| **Admin**        | `/admin/dashboard`         | Full system access, user management, reports      |
| **Doctor**       | `/doctor/dashboard`        | Patient management, appointments, prescriptions   |
| **Lab Technician** | `/lab/dashboard`         | Sample management, test results                     |
| **Receptionist** | `/receptionist/dashboard` | Patient registration, appointment scheduling       |

**Features:**
- ✅ `RoleBasedRoute` component for route-level protection
- ✅ `RoleGuard` component for permission-based access
- ✅ Automatic redirect to role-appropriate dashboard
- ✅ Permission-based navigation menu filtering
- ✅ Route permission checking via `hasRoutePermission()`

## 🎯 Key Features by Layer

### Application Layer (apps/web)

| Feature                | Technology            | Status             |
| ---------------------- | --------------------- | ------------------ |
| **40+ Routes**         | React 19 + TypeScript | ✅ Implemented     |
| **File-based Routing** | TanStack Router       | ✅ Configured      |
| **Server State**       | TanStack Query        | ✅ Implemented     |
| **Form Management**    | React Hook Form + Zod | ✅ Implemented     |
| **Authentication**     | JWT + Token Refresh   | ✅ Implemented     |
| **Role-Based Access**  | RBAC with Guards      | ✅ Implemented     |
| **Theme System**       | Dark/Light Mode       | ✅ Implemented     |
| **Responsive Design**  | Mobile-first          | ✅ Implemented     |
| **Export Features**    | PDF/Excel (jsPDF, xlsx) | ✅ Implemented    |
| **4 User Roles**       | Admin, Doctor, Lab, Receptionist | ✅ Implemented |

### UI Package (packages/ui)

| Category             | Components                            | Count   |
| -------------------- | ------------------------------------- | ------- |
| **Forms**            | Button, Input, Select, Checkbox, etc. | 15+     |
| **Data Display**     | DataTable, Card, Badge, Calendar      | 10+     |
| **Layout**           | Dialog, Sidebar, Menu, Tabs           | 12+     |
| **Feedback**         | Toast, Progress, Spinner, Skeleton    | 8+      |
| **Utilities**        | Provider, Hooks, Utils                | 5+      |
| **Total Components** | -                                     | **50+** |

### API SDK Package (packages/lib)

| API Module                | Description                      | Status              |
| ------------------------- | -------------------------------- | ------------------- |
| **Authentication**        | Login, Register, Token Refresh  | ✅ Implemented       |
| **User Management**       | User CRUD Operations             | ✅ Implemented       |
| **Patient Management**    | Patient CRUD & List Operations   | ✅ Implemented       |
| **Doctor Operations**     | Doctor-specific APIs & Statistics| ✅ Implemented       |
| **Relationships**         | Patient Relationships            | ✅ Implemented       |
| **Services**              | Service Management               | ✅ Implemented       |
| **Service Categories**    | Category Management              | ✅ Implemented       |
| **Service Requests**      | Service Request Management       | ✅ Implemented       |
| **Service Request Details**| Request Detail Management        | ✅ Implemented       |
| **Appointments**          | Appointment Scheduling           | ✅ Implemented       |
| **Samples**               | Sample Management                | ✅ Implemented       |
| **Example**               | Example/Template API              | ✅ Implemented       |
| **Total API Modules**     | **13 modules**                   | ✅ Connected to API  |

## 🚀 Development Workflow

```mermaid
graph LR
    Dev["Developer"] -->|1. Code| Local["Local Development - pnpm dev"]
    Local -->|2. Auto-reload| Browser["Browser - localhost:5173"]
    Browser -->|3. Hot Reload| Local

    Local -->|4. Lint| ESLint["ESLint Check"]
    ESLint -->|5. Format| Prettier["Prettier Formatting"]

    Prettier -->|6. Type Check| TSC["TypeScript Check"]
    TSC -->|7. Build| Turbo["Turborepo Build"]

    Turbo -->|8. Test| Tests["Unit Tests - Future"]
    Tests -->|9. Deploy| Production["Production Build"]
```

## 📊 Performance Optimization

### Code Splitting Strategy

```mermaid
graph TB
    subgraph "Bundle Strategy"
        Entry["Entry Point - main.tsx"]

        subgraph "Route Chunks"
            Home["Home - index.tsx"]
            Auth["Auth Routes - login, register"]
            App["App Routes - dashboard, patients"]
        end

        subgraph "Vendor Chunks"
            React["React + ReactDOM"]
            Router["TanStack Router & Query"]
            UI["UI Components - Lazy loaded"]
        end

        Entry --> Home
        Entry --> Auth
        Entry --> App
        Entry --> React
        Entry --> Router
        App --> UI
    end
```

### Optimization Techniques

1. **Code Splitting**: Route-based automatic splitting
2. **Lazy Loading**: Components loaded on demand
3. **Tree Shaking**: Unused code elimination
4. **Caching**: TanStack Query caching strategy
5. **Memoization**: React.memo for expensive components
6. **Virtual Scrolling**: For large lists (DataTable)

## 🔄 State Management Strategy

```mermaid
graph TB
    subgraph "State Types"
        Server["Server State - TanStack Query"]
        Form["Form State - React Hook Form"]
        UI["UI State - React State"]
        Global["Global State - React Context"]
    end

    API["Backend API"] --> Server
    User["User Input"] --> Form
    Components["Components"] --> UI
    App["Application"] --> Global
```

## 🎨 Design System

### Theme Configuration

```javascript
// Tailwind Design Tokens
{
  colors: {
    primary: "hsl(var(--primary))",
    secondary: "hsl(var(--secondary))",
    accent: "hsl(var(--accent))",
    // ... more colors
  },
  spacing: "4px base scale",
  typography: "Inter font family",
  borderRadius: "0.5rem default",
  animations: "Tailwind + React Aria"
}
```

### Component Variants

- **Button**: 10+ variants (primary, secondary, outline, ghost, etc.)
- **Badge**: Status colors (green, blue, orange, red, gray)
- **Card**: Elevated, outlined, interactive
- **Form Fields**: Default, error, disabled states

## 📱 Responsive Design

### Breakpoints

| Breakpoint  | Size           | Layout                   |
| ----------- | -------------- | ------------------------ |
| **Mobile**  | < 768px        | 1 column, hamburger menu |
| **Tablet**  | 768px - 1024px | 2 columns, drawer menu   |
| **Desktop** | > 1024px       | 3-4 columns, sidebar     |
| **Wide**    | > 1440px       | Full features, max-width |

## 🧪 Testing Strategy (Future)

```mermaid
graph TB
    subgraph "Testing Pyramid"
        E2E["E2E Tests - Playwright/Cypress"]
        Integration["Integration Tests - React Testing Library"]
        Unit["Unit Tests - Vitest"]
    end

    Unit --> Integration
    Integration --> E2E
```

## 📦 Deployment Architecture

```mermaid
graph LR
    subgraph "Build Process"
        Source["Source Code"] -->|Turbo Build| Build["Production Build"]
        Build --> Optimize["Optimize Assets"]
    end

    subgraph "Deployment"
        Optimize --> CDN["CDN - Static Assets"]
        Optimize --> Host["Hosting - Vercel/Netlify"]
    end

    subgraph "Runtime"
        User["Users"] --> CDN
        CDN --> Host
        Host --> API["Backend API"]
    end
```

## 🎯 Next Steps for Production

### Phase 1: Backend Integration ✅

- [x] Connect API endpoints (13 modules implemented)
- [x] Implement authentication flow (JWT + Refresh)
- [x] Implement role-based access control
- [x] Test CRUD operations
- [x] Handle error cases (401, token refresh)
- [x] Export utilities (PDF/Excel)

### Phase 2: Enhanced Features ✅

- [x] Calendar component (appointments - DatePicker/Calendar)
- [x] Export features (PDF/Excel via jsPDF, xlsx)
- [x] File upload components (Dropzone, Uploader)
- [x] Multi-role dashboard layouts
- [x] Form modals for quick actions
- [ ] Charts library integration (dashboard analytics)
- [ ] Real-time notifications

### Phase 3: Testing & QA

- [ ] Unit tests for utilities
- [ ] Integration tests for pages
- [ ] E2E tests for user flows
- [ ] Accessibility audit

### Phase 4: Performance

- [ ] Lighthouse optimization
- [ ] Bundle size optimization
- [ ] Image optimization
- [ ] Caching strategy

### Phase 5: Production Ready

- [ ] Environment configuration
- [ ] CI/CD pipeline
- [ ] Monitoring & logging
- [ ] Documentation

## 📚 Documentation Links

- **Main README**: `/README.md`
- **Project Summary**: `/PROJECT_SUMMARY.md`
- **Implementation Summary**: `/IMPLEMENTATION_SUMMARY.md`
- **Web App Docs**: `/apps/web/README_CRYOBANK.md`
- **Usage Examples**: `/apps/web/USAGE_EXAMPLES.md`

## 🏆 Architecture Highlights

### ✅ Strengths

1. **Monorepo Structure**: Organized code sharing with Turborepo
2. **Type Safety**: Full TypeScript coverage
3. **Accessibility**: React Aria Components for WCAG compliance
4. **Scalability**: Modular architecture with clear separation
5. **Developer Experience**: Fast builds, hot reload, type checking
6. **Production Ready**: Professional code quality and structure
7. **Maintainability**: Clear patterns and comprehensive documentation
8. **Performance**: Optimized build with code splitting

### 🎯 Best Practices Implemented

- ✅ File-based routing for predictable structure
- ✅ Shared UI library for consistency
- ✅ API SDK for type-safe backend communication
- ✅ Form validation with Zod schemas
- ✅ Error boundaries and loading states
- ✅ Responsive mobile-first design
- ✅ Dark mode support
- ✅ Comprehensive TypeScript types

---

### 📊 Current Statistics

- **Total Routes**: 40+ (Public + Role-based)
- **API Modules**: 13 (Fully implemented & connected)
- **UI Components**: 50+ (Shared component library)
- **User Roles**: 4 (Admin, Doctor, Lab Technician, Receptionist)
- **Protected Routes**: 30+ (Role-based access control)
- **Export Formats**: PDF, Excel (jsPDF, xlsx)

---

**Version**: 2.0  
**Last Updated**: January 2025  
**Project**: Fertility Service & Cryobank Management System  
**Stack**: React 19 + TypeScript + Vite + TanStack Router + TanStack Query + React Aria Components  
**Backend API**: Connected to `https://cryofert.runasp.net/api`
