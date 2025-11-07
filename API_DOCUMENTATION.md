# API Documentation

Tài liệu này mô tả tất cả các API đã được tích hợp từ Swagger JSON: https://cryofert.runasp.net/swagger/v1/swagger.json

## Authentication APIs

### `POST /auth/login`

Đăng nhập với email và password

```typescript
api.login({ email: string, password: string });
```

### `POST /auth/logout`

Đăng xuất

```typescript
api.logout();
```

### `GET /auth/me`

Lấy thông tin user hiện tại

```typescript
api.getCurrentUser();
```

### `POST /auth/refresh-token`

Refresh access token

```typescript
api.refreshToken(refreshToken: string)
```

### `PUT /auth/profile`

Cập nhật profile

```typescript
api.updateProfile(data: Partial<User>)
```

### `POST /auth/register`

Đăng ký tài khoản mới

```typescript
api.register({ userName, email, password, phone?, age?, location?, country? })
```

### `POST /auth/forgot-password`

Quên mật khẩu

```typescript
api.forgotPassword({ email: string });
```

### `POST /auth/reset-password`

Đặt lại mật khẩu

```typescript
api.resetPassword({ token: string, newPassword: string });
```

### `POST /auth/change-password`

Đổi mật khẩu

```typescript
api.changePassword({ currentPassword: string, newPassword: string });
```

### `POST /auth/verify-email`

Xác thực email

```typescript
api.verifyEmail({ token: string });
```

### `POST /auth/send-verification-email`

Gửi email xác thực

```typescript
api.sendVerificationEmail();
```

## User APIs

### `GET /user`

Lấy danh sách users

```typescript
api.getUsers({ Page?, Size?, SearchTerm? })
```

### `GET /user/{id}`

Lấy thông tin user theo ID

```typescript
api.getUserById(id: string)
```

### `POST /user`

Tạo user mới

```typescript
api.createUser(data: Partial<User>)
```

### `PUT /user/{id}`

Cập nhật user

```typescript
api.updateUser(id: string, data: Partial<User>)
```

### `DELETE /user/{id}`

Xóa user

```typescript
api.deleteUser(id: string)
```

## Appointment APIs

### `GET /appointment`

Lấy danh sách appointments

```typescript
api.getAppointments({
  TreatmentCycleId?, DoctorId?, SlotId?, Type?, Status?,
  AppointmentDateFrom?, AppointmentDateTo?, SearchTerm?,
  Page?, Size?, Sort?, Order?
})
```

### `GET /appointment/{id}`

Lấy thông tin appointment theo ID

```typescript
api.getAppointmentById(id: string)
```

### `GET /appointment/{id}/details`

Lấy chi tiết appointment

```typescript
api.getAppointmentDetails(id: string)
```

### `POST /appointment`

Tạo appointment mới

```typescript
api.createAppointment({
  patientId, type, title, appointmentDate,
  startTime, endTime, description?, slotId?,
  treatmentCycleId?, reason?, instructions?
})
```

### `PUT /appointment/{id}`

Cập nhật appointment

```typescript
api.updateAppointment(id: string, data: UpdateAppointmentRequest)
```

### `DELETE /appointment/{id}`

Xóa appointment

```typescript
api.deleteAppointment(id: string)
```

### `PATCH /appointment/{id}/status`

Cập nhật trạng thái appointment

```typescript
api.updateAppointmentStatus(id: string, status: AppointmentStatus)
```

### `POST /appointment/{id}/cancel`

Hủy appointment

```typescript
api.cancelAppointment(id: string, reason?: string)
```

### `POST /appointment/{id}/add-doctor`

Thêm bác sĩ vào appointment

```typescript
api.addDoctorToAppointment(id: string, doctorId: string)
```

### `PUT /appointment/{id}/doctor-role`

Cập nhật vai trò bác sĩ trong appointment

```typescript
api.updateDoctorRole(id: string, doctorId: string, role?: string)
```

## Patient APIs

### `GET /patient`

Lấy danh sách patients

```typescript
api.getPatients({ SearchTerm?, Page?, Size?, Sort?, Order? })
```

### `GET /patient/{id}`

Lấy thông tin patient theo ID

```typescript
api.getPatientById(id: string)
```

### `POST /patient`

Tạo patient mới

```typescript
api.createPatient(data: Partial<Patient>)
```

### `PUT /patient/{id}`

Cập nhật patient

```typescript
api.updatePatient(id: string, data: Partial<Patient>)
```

### `DELETE /patient/{id}`

Xóa patient

```typescript
api.deletePatient(id: string)
```

## Lab Sample APIs

### `GET /sample`

Lấy danh sách samples

```typescript
api.getSamples({ PatientId?, Status?, SearchTerm?, Page?, Size? })
```

### `GET /sample/{id}`

Lấy thông tin sample theo ID

```typescript
api.getSampleById(id: string)
```

### `POST /sample`

Tạo sample mới

```typescript
api.createSample(data: Partial<LabSample>)
```

### `PUT /sample/{id}`

Cập nhật sample

```typescript
api.updateSample(id: string, data: Partial<LabSample>)
```

### `DELETE /sample/{id}`

Xóa sample

```typescript
api.deleteSample(id: string)
```

## Doctor APIs

### `GET /doctor`

Lấy danh sách doctors

```typescript
api.getDoctors({ Page?, Size?, SearchTerm?, Specialty?, Status?, Sort?, Order? })
```

### `GET /doctor/{id}`

Lấy thông tin doctor theo ID

```typescript
api.getDoctorById(id: string)
```

### `GET /doctor/{id}/statistics`

Lấy thống kê của doctor

```typescript
api.getDoctorStatistics(id: string)
```

### `POST /doctor`

Tạo doctor mới

```typescript
api.createDoctor(data: Partial<Doctor>)
```

### `PUT /doctor/{id}`

Cập nhật doctor

```typescript
api.updateDoctor(id: string, data: Partial<Doctor>)
```

### `DELETE /doctor/{id}`

Xóa doctor

```typescript
api.deleteDoctor(id: string)
```

## Doctor Schedule APIs

### `GET /doctor-schedule`

Lấy danh sách doctor schedules

```typescript
api.getDoctorSchedules({
  Page?, Size?, DoctorId?, WorkDate?,
  StartDate?, EndDate?, IsAvailable?
})
```

### `GET /doctor-schedule/{id}`

Lấy thông tin schedule theo ID

```typescript
api.getDoctorScheduleById(id: string)
```

### `GET /doctor-schedule/doctor/{doctorId}`

Lấy schedules của một doctor

```typescript
api.getSchedulesByDoctor(doctorId: string)
```

### `POST /doctor-schedule`

Tạo schedule mới

```typescript
api.createDoctorSchedule(data: Partial<DoctorSchedule>)
```

### `PUT /doctor-schedule/{id}`

Cập nhật schedule

```typescript
api.updateDoctorSchedule(id: string, data: Partial<DoctorSchedule>)
```

### `DELETE /doctor-schedule/{id}`

Xóa schedule

```typescript
api.deleteDoctorSchedule(id: string)
```

## Service APIs

### `GET /service`

Lấy danh sách services

```typescript
api.getServices({ Page?, Size?, CategoryId?, SearchTerm?, Status?, Sort?, Order? })
```

### `GET /service/{id}`

Lấy thông tin service theo ID

```typescript
api.getServiceById(id: string)
```

### `POST /service`

Tạo service mới

```typescript
api.createService(data: Partial<Service>)
```

### `PUT /service/{id}`

Cập nhật service

```typescript
api.updateService(id: string, data: Partial<Service>)
```

### `DELETE /service/{id}`

Xóa service

```typescript
api.deleteService(id: string)
```

## Service Category APIs

### `GET /service-category`

Lấy danh sách service categories

```typescript
api.getServiceCategories({ Page?, Size?, SearchTerm? })
```

### `GET /service-category/{id}`

Lấy thông tin category theo ID

```typescript
api.getServiceCategoryById(id: string)
```

### `POST /service-category`

Tạo category mới

```typescript
api.createServiceCategory(data: Partial<ServiceCategory>)
```

### `PUT /service-category/{id}`

Cập nhật category

```typescript
api.updateServiceCategory(id: string, data: Partial<ServiceCategory>)
```

### `DELETE /service-category/{id}`

Xóa category

```typescript
api.deleteServiceCategory(id: string)
```

## Service Request APIs

### `GET /service-request`

Lấy danh sách service requests

```typescript
api.getServiceRequests({
  Page?, Size?, PatientId?, ServiceId?, Status?, SearchTerm?
})
```

### `GET /service-request/{id}`

Lấy thông tin service request theo ID

```typescript
api.getServiceRequestById(id: string)
```

### `POST /service-request`

Tạo service request mới

```typescript
api.createServiceRequest(data: Partial<ServiceRequest>)
```

### `PUT /service-request/{id}`

Cập nhật service request

```typescript
api.updateServiceRequest(id: string, data: Partial<ServiceRequest>)
```

### `DELETE /service-request/{id}`

Xóa service request

```typescript
api.deleteServiceRequest(id: string)
```

## Slot APIs

### `GET /slot`

Lấy danh sách slots

```typescript
api.getSlots({
  Page?, Size?, ScheduleId?, DoctorId?, Date?,
  StartDate?, EndDate?, BookingStatus?, SearchTerm?
})
```

### `GET /slot/{id}`

Lấy thông tin slot theo ID

```typescript
api.getSlotById(id: string)
```

### `POST /slot`

Tạo slot mới

```typescript
api.createSlot(data: Partial<TimeSlot>)
```

### `PUT /slot/{id}`

Cập nhật slot

```typescript
api.updateSlot(id: string, data: Partial<TimeSlot>)
```

### `DELETE /slot/{id}`

Xóa slot

```typescript
api.deleteSlot(id: string)
```

### `POST /slot/generate`

Tạo nhiều slots tự động

```typescript
api.generateSlots(scheduleId: string, startDate: string, endDate: string)
```

## Treatment Cycle APIs

### `GET /treatment-cycle`

Lấy danh sách treatment cycles

```typescript
api.getTreatmentCycles({ Page?, Size?, PatientId?, Status?, SearchTerm? })
```

### `GET /treatment-cycle/{id}`

Lấy thông tin treatment cycle theo ID

```typescript
api.getTreatmentCycleById(id: string)
```

### `POST /treatment-cycle`

Tạo treatment cycle mới

```typescript
api.createTreatmentCycle(data: Partial<TreatmentCycle>)
```

### `PUT /treatment-cycle/{id}`

Cập nhật treatment cycle

```typescript
api.updateTreatmentCycle(id: string, data: Partial<TreatmentCycle>)
```

### `DELETE /treatment-cycle/{id}`

Xóa treatment cycle

```typescript
api.deleteTreatmentCycle(id: string)
```

## Relationship APIs

### `GET /relationship/patient/{patientId}`

Lấy relationships của một patient

```typescript
api.getRelationships(patientId: string)
```

### `GET /relationship/{id}`

Lấy thông tin relationship theo ID

```typescript
api.getRelationshipById(id: string)
```

### `POST /relationship`

Tạo relationship mới

```typescript
api.createRelationship(data: Partial<Relationship>)
```

### `PUT /relationship/{id}`

Cập nhật relationship

```typescript
api.updateRelationship(id: string, data: Partial<Relationship>)
```

### `DELETE /relationship/{id}`

Xóa relationship

```typescript
api.deleteRelationship(id: string)
```

## Usage Example

```typescript
import { api } from "@/api/client";

// Login
const loginResponse = await api.login({
  email: "user@example.com",
  password: "password",
});

// Get appointments
const appointments = await api.getAppointments({ Page: 1, Size: 20 });

// Get doctors
const doctors = await api.getDoctors({ Page: 1, Size: 10 });

// Create appointment
const newAppointment = await api.createAppointment({
  patientId: "patient-id",
  type: "consultation",
  title: "Consultation",
  appointmentDate: "2024-01-01",
  startTime: "09:00",
  endTime: "10:00",
});
```

## Response Format

Tất cả API responses đều tuân theo format:

```typescript
{
  code?: number;
  systemCode?: string | null;
  message?: string | null;
  data?: T | T[];
  metaData?: {
    page?: number;
    size?: number;
    total?: number;
    totalPages?: number;
  };
  timestamp?: string;
  success?: boolean;
}
```

## Error Handling

API client tự động xử lý:

- Token injection vào mọi request
- Token refresh khi hết hạn (401)
- Redirect về login khi không authenticated
- Error handling và logging
