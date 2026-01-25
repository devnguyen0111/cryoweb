# FSCMS - Fertility Service & Cryobank Management System

Hệ thống quản lý dịch vụ sinh sản và ngân hàng tế bào đông lạnh dành cho nhân viên bệnh viện.

## 📋 Mục lục

- [Giới thiệu](#giới-thiệu)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cài đặt](#cài-đặt)
- [Cấu hình](#cấu-hình)
- [Chạy dự án](#chạy-dự-án)
- [Roles và quyền truy cập](#roles-và-quyền-truy-cập)
- [Tính năng chính](#tính-năng-chính)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [API Integration](#api-integration)
- [Authentication](#authentication)
- [Development](#development)

## 🎯 Giới thiệu

FSCMS là hệ thống quản lý toàn diện cho bệnh viện chuyên về dịch vụ sinh sản và ngân hàng tế bào đông lạnh. Hệ thống hỗ trợ 4 vai trò người dùng với các chức năng chuyên biệt, từ quản lý bệnh nhân, lịch hẹn, chu kỳ điều trị đến quản lý mẫu xét nghiệm và giao dịch.

## 🛠 Công nghệ sử dụng

### Core Technologies

- **React 18.3.1** - UI Framework
- **TypeScript 5.7.2** - Type safety
- **Vite 6.0.5** - Build tool & Dev server

### Routing & State Management

- **TanStack Router 1.132.37** - Type-safe routing
- **TanStack Query 5.87.1** - Server state management & data fetching
- **TanStack Router Devtools** - Development tools for routing
- **TanStack Query Devtools** - Development tools for queries

### HTTP Client & API

- **Axios 1.12.2** - HTTP client với interceptors
- Custom API client với automatic token injection và refresh

### Form Management & Validation

- **React Hook Form 7.62.0** - Form state management
- **Zod 3.24.2** - Schema validation
- **@hookform/resolvers 3.9.1** - Integration với Zod

### UI & Styling

- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **tailwindcss-animate 1.0.7** - Animation utilities
- **tailwind-merge 2.6.0** - Merge Tailwind classes
- **class-variance-authority 0.7.1** - Component variants
- **clsx 2.1.1** - Conditional classnames
- **lucide-react 0.475.0** - Icon library

### Notifications

- **sonner 2.0.7** - Toast notifications

### Development Tools

- **ESLint 9.18.0** - Code linting
- **Vitest 2.1.4** - Unit testing framework
- **TypeScript ESLint** - TypeScript linting
- **PostCSS & Autoprefixer** - CSS processing

### Requirements

- **Node.js >= 18**

## 📦 Cài đặt

```bash
# Clone repository
git clone <repository-url>
cd cryoweb

# Cài đặt dependencies
npm install

# Hoặc sử dụng package manager khác
pnpm install
# hoặc
yarn install
```

## ⚙️ Cấu hình

### Environment Variables

Tạo file `.env` trong thư mục root và cấu hình:

```env
VITE_API_URL=https://cryofert-bfbqgkgzf8b3e9ap.southeastasia-01.azurewebsites.net/api
```

Default API URL: `https://cryofert-bfbqgkgzf8b3e9ap.southeastasia-01.azurewebsites.net/api`

## 🚀 Chạy dự án

### Development Mode

```bash
npm run dev
```

Dự án sẽ chạy tại: `http://localhost:5173` (hoặc port khác nếu 5173 đã được sử dụng)

### Build Production

```bash
npm run build
```

Build files sẽ được tạo trong thư mục `dist/`

### Preview Production Build

```bash
npm run preview
```

### Scripts khác

```bash
# Generate route tree (tự động chạy khi build)
npm run generate

# Lint code
npm run lint

# Chạy tests
npm run test
```

## 👥 Roles và quyền truy cập

Hệ thống hỗ trợ 4 roles với các quyền truy cập khác nhau:

### 1. Administrator (Admin)

Quyền truy cập đầy đủ hệ thống:

- ✅ Quản lý Users (xem, tạo, sửa, xóa)
- ✅ Quản lý Patients (xem, tạo, sửa, xóa)
- ✅ Quản lý Appointments (xem, tạo, sửa, xóa)
- ✅ Quản lý Samples (xem, tạo, sửa, xóa)
- ✅ Quản lý Categories & Content
- ✅ Xem Reports & Logs
- ✅ Quản lý Settings
- ✅ Quản lý Treatments & Treatment Cycles
- ✅ Quản lý Prescriptions
- ✅ Truy cập Cryobank
- ✅ Quản lý Schedule

### 2. Doctor (Bác sĩ)

Quản lý bệnh nhân và điều trị:

- ✅ Quản lý Patients (xem, tạo, sửa)
- ✅ Quản lý Appointments (xem, tạo, sửa)
- ✅ Quản lý Samples (xem, tạo, sửa)
- ✅ Quản lý Treatments (điều trị)
- ✅ Quản lý Treatment Cycles (chu kỳ điều trị)
- ✅ Quản lý Medical Records (hồ sơ bệnh án)
- ✅ Quản lý Service Requests (yêu cầu dịch vụ)
- ✅ Quản lý Prescriptions (đơn thuốc)
- ✅ Truy cập Cryobank
- ✅ Xem Reports
- ✅ Quản lý Schedule
- ❌ Quản lý Users
- ❌ Quản lý Settings

### 3. Receptionist (Lễ tân)

Quản lý lịch hẹn và giao dịch:

- ✅ Quản lý Patients (xem, tạo, sửa)
- ✅ Quản lý Appointments (xem, tạo, sửa)
- ✅ Quản lý Service Requests (xem, tạo, sửa)
- ✅ Quản lý Transactions (giao dịch)
- ✅ Xem Schedule
- ✅ Xem Reports
- ✅ Xem Samples (read-only)
- ❌ Quản lý Treatments
- ❌ Quản lý Treatment Cycles

### 4. Lab Technician (Kỹ thuật viên Lab)

Quản lý mẫu xét nghiệm:

- ✅ Quản lý Samples (xem, tạo, sửa)
- ✅ Quản lý Tests (xem, tạo, sửa)
- ✅ Xem Dashboard
- ❌ Quản lý Patients
- ❌ Quản lý Appointments

## 🎨 Tính năng chính

### Quản lý Bệnh nhân (Patients)

- Danh sách bệnh nhân với tìm kiếm và lọc
- Chi tiết bệnh nhân đầy đủ
- Tạo và cập nhật thông tin bệnh nhân
- Quản lý quan hệ gia đình (relationships)
- Lịch sử điều trị và hồ sơ bệnh án

### Quản lý Lịch hẹn (Appointments)

- Xem danh sách lịch hẹn theo ngày/tuần/tháng
- Tạo lịch hẹn mới với slot time
- Chi tiết lịch hẹn với thông tin đầy đủ
- Quản lý lịch hẹn theo vai trò:
  - Doctor: Tạo và quản lý lịch hẹn của mình
  - Receptionist: Quản lý tất cả lịch hẹn
  - Admin: Quản lý toàn bộ lịch hẹn

### Quản lý Điều trị (Treatments)

- Tạo treatment mới cho bệnh nhân
- Form khám bệnh chi tiết với nhiều bước:
  - Thông tin cơ bản
  - Chẩn đoán
  - Kế hoạch điều trị
  - Đơn thuốc
- Quản lý treatment details (IVF, IUI)
- Xem lịch sử khám bệnh

### Quản lý Chu kỳ điều trị (Treatment Cycles)

- Tạo và quản lý treatment cycles
- Timeline điều trị trực quan (horizontal & vertical)
- Cập nhật trạng thái chu kỳ:
  - Planned, Active, Monitoring, Stimulation, Retrieval, Transfer, Waiting, Cancelled, Completed
- Quản lý service requests trong chu kỳ
- Treatment plan form với signature
- Agreement documents
- Cycle update forms chi tiết

### Quản lý Yêu cầu dịch vụ (Service Requests)

- Tạo service request cho bệnh nhân
- Chi tiết service request với actions
- Quản lý service request details
- Liên kết với treatment cycles
- Cập nhật trạng thái service request

### Quản lý Mẫu xét nghiệm (Samples)

- Quản lý samples trong cryobank
- Track samples theo bệnh nhân
- Lab technician quản lý samples và tests
- Chi tiết sample đầy đủ

### Quản lý Đơn thuốc (Prescriptions)

- Tạo và quản lý đơn thuốc
- Liên kết với treatments
- Chi tiết đơn thuốc

### Quản lý Hồ sơ bệnh án (Medical Records)

- Tạo medical records
- Structured notes
- Lịch sử hồ sơ bệnh án

### Cryobank Management

- Quản lý samples đông lạnh
- Track storage location
- Quản lý inventory

### Quản lý Giao dịch (Transactions)

- Xem danh sách transactions
- Chi tiết giao dịch
- Liên kết với service requests

### Reports & Analytics

- Dashboard với KPI cards
- Reports theo role
- Statistics và analytics

### User Management (Admin only)

- Quản lý users
- Phân quyền theo role
- User profiles

### Content Management (Admin only)

- Quản lý categories
- Quản lý content
- System settings

### Schedule Management

- Xem lịch làm việc
- Quản lý slots
- Doctor schedule

## 📁 Cấu trúc dự án

```
cryoweb/
├── src/
│   ├── api/                          # API client và modules
│   │   ├── client.ts                 # Main API client với interceptors
│   │   ├── types.ts                  # API types
│   │   └── modules/                  # API modules (25 modules)
│   │       ├── agreement.api.ts
│   │       ├── appointment.api.ts
│   │       ├── appointment-doctor.api.ts
│   │       ├── auth.api.ts
│   │       ├── cycle-document.api.ts
│   │       ├── doctor.api.ts
│   │       ├── doctor-schedule.api.ts
│   │       ├── medical-record.api.ts
│   │       ├── patient.api.ts
│   │       ├── relationship.api.ts
│   │       ├── sample.api.ts
│   │       ├── service.api.ts
│   │       ├── service-category.api.ts
│   │       ├── service-request.api.ts
│   │       ├── service-request-details.api.ts
│   │       ├── slot.api.ts
│   │       ├── transaction.api.ts
│   │       ├── treatment.api.ts
│   │       ├── treatment-cycle.api.ts
│   │       ├── treatment-iui.api.ts
│   │       ├── treatment-ivf.api.ts
│   │       └── user.api.ts
│   │
│   ├── components/                   # React components
│   │   ├── admin/                    # Admin-specific components
│   │   │   ├── AdminBreadcrumbs.tsx
│   │   │   ├── AdminPageHeader.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── KpiCard.tsx
│   │   │   ├── ListToolbar.tsx
│   │   │   └── StatusBadge.tsx
│   │   ├── layouts/                  # Layout components
│   │   │   └── DashboardLayout.tsx
│   │   ├── ui/                       # Reusable UI components
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── confirmation-dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── modal.tsx
│   │   │   └── textarea.tsx
│   │   ├── ProtectedRoute.tsx        # Route protection
│   │   ├── Providers.tsx             # Context providers
│   │   ├── StructuredNote.tsx        # Structured note component
│   │   └── treatment-cycle-status-badge.tsx
│   │
│   ├── contexts/                     # React contexts
│   │   └── AuthContext.tsx           # Authentication context
│   │
│   ├── features/                     # Feature-based components
│   │   ├── admin/
│   │   │   └── content/
│   │   │       └── mockData.ts
│   │   ├── doctor/                   # Doctor features
│   │   │   ├── appointments/
│   │   │   │   ├── DoctorAppointmentDetailModal.tsx
│   │   │   │   └── DoctorCreateAppointmentForm.tsx
│   │   │   ├── encounters/
│   │   │   │   ├── CreateTreatmentForm.tsx
│   │   │   │   ├── TreatmentDetailForm.tsx
│   │   │   │   └── TreatmentViewModal.tsx
│   │   │   ├── medical-records/
│   │   │   │   └── CreateMedicalRecordForm.tsx
│   │   │   ├── patients/
│   │   │   │   └── DoctorPatientDetailModal.tsx
│   │   │   ├── service-requests/
│   │   │   │   ├── CreateServiceRequestModal.tsx
│   │   │   │   ├── ServiceRequestActionModal.tsx
│   │   │   │   └── ServiceRequestDetailModal.tsx
│   │   │   └── treatment-cycles/
│   │   │       ├── AgreementDocument.tsx
│   │   │       ├── CreateServiceRequestForCycleModal.tsx
│   │   │       ├── CycleUpdateForm.tsx
│   │   │       ├── CycleUpdateModal.tsx
│   │   │       ├── HorizontalTreatmentTimeline.tsx
│   │   │       ├── PatientDetailModal.tsx
│   │   │       ├── TreatmentPlanForm.tsx
│   │   │       ├── TreatmentPlanSignature.tsx
│   │   │       └── TreatmentTimeline.tsx
│   │   └── receptionist/
│   │       └── appointments/
│   │           └── AppointmentDetailForm.tsx
│   │
│   ├── hooks/                        # Custom React hooks
│   │   └── useDoctorProfile.ts
│   │
│   ├── routes/                       # TanStack Router routes
│   │   ├── __root.tsx                # Root route
│   │   ├── index.tsx                 # Home route
│   │   ├── login.tsx                 # Login page
│   │   ├── unauthorized.tsx          # Unauthorized page
│   │   ├── admin/                    # Admin routes
│   │   │   ├── dashboard.tsx
│   │   │   ├── patients.tsx
│   │   │   ├── patients.$patientId.tsx
│   │   │   ├── appointments.tsx
│   │   │   ├── samples.tsx
│   │   │   ├── users.tsx
│   │   │   ├── users.$userId.tsx
│   │   │   ├── categories.tsx
│   │   │   ├── categories.$categoryId.tsx
│   │   │   ├── content.tsx
│   │   │   ├── content.$contentId.tsx
│   │   │   ├── reports.tsx
│   │   │   ├── logs.tsx
│   │   │   └── settings.tsx
│   │   ├── doctor/                   # Doctor routes
│   │   │   ├── dashboard.tsx
│   │   │   ├── patients.tsx
│   │   │   ├── patients.$patientId.tsx
│   │   │   ├── appointments.tsx
│   │   │   ├── appointments.$appointmentId.tsx
│   │   │   ├── encounters.tsx
│   │   │   ├── encounters.create.tsx
│   │   │   ├── encounters.$encounterId.tsx
│   │   │   ├── encounters.$encounterId.diagnosis.tsx
│   │   │   ├── treatment-cycles.tsx
│   │   │   ├── treatment-cycles.$cycleId.tsx
│   │   │   ├── service-requests.tsx
│   │   │   ├── medical-records.tsx
│   │   │   ├── prescriptions.tsx
│   │   │   ├── samples.tsx
│   │   │   ├── cryobank.tsx
│   │   │   ├── schedule.tsx
│   │   │   └── reports.tsx
│   │   ├── receptionist/             # Receptionist routes
│   │   │   ├── dashboard.tsx
│   │   │   ├── patients.tsx
│   │   │   ├── patients.$patientId.tsx
│   │   │   ├── appointments.tsx
│   │   │   ├── appointments.create.tsx
│   │   │   ├── appointments.$appointmentId.tsx
│   │   │   ├── service-requests.tsx
│   │   │   ├── service-requests.$serviceRequestId.tsx
│   │   │   ├── transactions.tsx
│   │   │   ├── schedule.tsx
│   │   │   └── reports.tsx
│   │   └── lab-technician/           # Lab Technician routes
│   │       ├── dashboard.tsx
│   │       ├── samples.tsx
│   │       └── tests.tsx
│   │
│   ├── styles/                       # Global styles
│   │   └── globals.css
│   │
│   ├── types/                        # TypeScript types
│   │   └── auth.ts                   # Authentication types & permissions
│   │
│   ├── utils/                        # Utility functions
│   │   ├── appointments.ts           # Appointment utilities
│   │   ├── capitalize.ts             # String utilities
│   │   ├── cn.ts                     # Classname utilities
│   │   ├── id-helpers.ts             # ID utilities
│   │   ├── patient-helpers.ts        # Patient utilities
│   │   ├── queryClient.ts            # TanStack Query client config
│   │   └── treatment-cycle-status.ts # Treatment cycle status utilities
│   │
│   ├── docs/                         # Documentation
│   │   ├── api-types.ts              # API type definitions
│   │   └── database/
│   │       └── cryofertSQL.sql       # Database schema
│   │
│   ├── main.tsx                      # Application entry point
│   ├── routeTree.gen.ts              # Auto-generated route tree
│   └── vite-env.d.ts                 # Vite type definitions
│
├── public/                           # Static assets
├── dist/                             # Build output
├── node_modules/                     # Dependencies
├── index.html                        # HTML template
├── package.json                      # Dependencies & scripts
├── package-lock.json                 # Lock file
├── tsconfig.json                     # TypeScript config
├── tsconfig.node.json                # TypeScript config for Node
├── vite.config.ts                    # Vite configuration
├── tailwind.config.js                # Tailwind CSS config
├── postcss.config.js                 # PostCSS config
├── tanstack.config.ts                # TanStack Router config
├── .eslintrc.cjs                     # ESLint config
├── .gitignore                        # Git ignore rules
├── README.md                         # This file
└── INSTALLATION.md                   # Installation guide
```

## 🔌 API Integration

### API Base URL

```
https://cryofert-bfbqgkgzf8b3e9ap.southeastasia-01.azurewebsites.net/api
```

### API Modules (25 modules)

Hệ thống tích hợp với 25 API modules:

1. **Agreement API** - Quản lý hợp đồng/giấy tờ thỏa thuận
2. **Appointment API** - Quản lý lịch hẹn
3. **Appointment Doctor API** - Lịch hẹn theo bác sĩ
4. **Auth API** - Xác thực và đăng nhập
5. **Cycle Document API** - Tài liệu chu kỳ điều trị
6. **Doctor API** - Thông tin bác sĩ
7. **Doctor Schedule API** - Lịch làm việc bác sĩ
8. **Medical Record API** - Hồ sơ bệnh án
9. **Patient API** - Quản lý bệnh nhân
10. **Relationship API** - Quan hệ gia đình
11. **Sample API** - Quản lý mẫu xét nghiệm
12. **Service API** - Dịch vụ
13. **Service Category API** - Danh mục dịch vụ
14. **Service Request API** - Yêu cầu dịch vụ
15. **Service Request Details API** - Chi tiết yêu cầu dịch vụ
16. **Slot API** - Quản lý time slots
17. **Transaction API** - Giao dịch
18. **Treatment API** - Điều trị
19. **Treatment Cycle API** - Chu kỳ điều trị
20. **Treatment IUI API** - Điều trị IUI
21. **Treatment IVF API** - Điều trị IVF
22. **User API** - Quản lý người dùng

### API Client Features

- ✅ Automatic token injection trong request headers
- ✅ Token refresh tự động khi hết hạn (401 error)
- ✅ Error handling và interceptors
- ✅ Request timeout: 30 seconds
- ✅ Base URL configuration từ environment variables
- ✅ Type-safe API calls với TypeScript

## 🔐 Authentication

### Authentication Flow

1. **Login**: User đăng nhập với email/password
2. **Token Storage**: JWT token và refresh token được lưu trong `localStorage`
3. **Automatic Token Injection**: Token tự động được thêm vào mọi API request
4. **Token Refresh**: Khi nhận 401, hệ thống tự động refresh token
5. **Auto Redirect**: Redirect về `/login` nếu authentication fail

### Protected Routes

- Routes được bảo vệ bởi `ProtectedRoute` component
- Kiểm tra authentication và role permissions
- Redirect nếu không có quyền truy cập

### Token Management

- **Access Token**: Lưu trong `localStorage` với key `authToken`
- **Refresh Token**: Lưu trong `localStorage` với key `refreshToken`
- **User Info**: Lưu trong `localStorage` với key `user`

## 💻 Development

### Code Style

- **ESLint**: Code linting với TypeScript ESLint
- **Prettier**: Code formatting (nếu được cấu hình)
- **TypeScript Strict Mode**: Type safety

### Development Tools

- **TanStack Router Devtools**: Debug routing trong development
- **TanStack Query Devtools**: Debug queries và cache
- **React DevTools**: React component debugging

### Building

```bash
# Build production
npm run build

# Build sẽ:
# 1. Generate route tree (tsr generate)
# 2. Type check (tsc)
# 3. Build với Vite (vite build)
```

### Testing

```bash
# Chạy tests
npm run test
```

## 🐛 Troubleshooting

### Lỗi routeTree.gen.ts không tồn tại

File này được tự động generate khi chạy dev server hoặc build. Nếu gặp lỗi:

```bash
npm run generate
# hoặc
npm run dev
```

### Lỗi API connection

1. Kiểm tra file `.env` có đúng API URL
2. Kiểm tra network connection
3. Kiểm tra CORS settings trên server
4. Kiểm tra token có hợp lệ không

### Lỗi build

```bash
# Xóa node_modules và dist
rm -rf node_modules dist

# Cài đặt lại
npm install

# Build lại
npm run build
```

### Lỗi TypeScript

```bash
# Check TypeScript errors
npx tsc --noEmit
```

## 📝 Notes

- TanStack Router sử dụng file-based routing
- Route tree được auto-generated từ file structure
- API client sử dụng singleton pattern
- TanStack Query cache được config trong `utils/queryClient.ts`
- UI components sử dụng Tailwind CSS với utility classes
- Forms sử dụng React Hook Form với Zod validation

## 📄 License

Private project - All rights reserved

## 👨‍💻 Development Team

FPT Software Development Team

---

**Version**: 1.0.0  
**Last Updated**: 2024
