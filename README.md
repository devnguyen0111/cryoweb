# FSCMS - Fertility Service & Cryobank Management System

Hệ thống quản lý dịch vụ sinh sản và ngân hàng tế bào đông lạnh dành cho nhân viên bệnh viện.

## Công nghệ sử dụng

- **React 18** - UI Framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TanStack Router** - Routing
- **TanStack Query** - Data fetching
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **React Hook Form + Zod** - Form validation

## Cài đặt

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build production
npm run build

# Preview production build
npm run preview
```

## Cấu hình

Tạo file `.env` từ `.env.example` và cấu hình API URL:

```
VITE_API_URL=https://cryofert.runasp.net/api
```

## Roles

Hệ thống hỗ trợ 4 roles:

1. **Administrator** - Quản trị viên hệ thống
2. **Doctor** - Bác sĩ
3. **Receptionist** - Lễ tân
4. **Lab Technician** - Kỹ thuật viên phòng lab

## Cấu trúc dự án

```
src/
├── api/           # API client và types
├── components/    # UI components
├── contexts/      # React contexts (Auth, etc.)
├── hooks/         # Custom hooks
├── layouts/       # Layout components
├── routes/        # TanStack Router routes
├── types/         # TypeScript types
├── utils/         # Utility functions
└── main.tsx       # Entry point
```
