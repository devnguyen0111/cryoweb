# Hướng dẫn cài đặt và chạy dự án

## Yêu cầu hệ thống

- Node.js >= 18
- npm hoặc pnpm hoặc yarn

## Cài đặt

1. Cài đặt dependencies:

```bash
npm install
# hoặc
pnpm install
# hoặc
yarn install
```

2. Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

3. Cấu hình API URL trong file `.env`:

```
VITE_API_URL=https://cryofert.runasp.net/api
```

## Chạy dự án

### Development mode

```bash
npm run dev
# hoặc
pnpm dev
# hoặc
yarn dev
```

Dự án sẽ chạy tại: http://localhost:3000

### Build production

```bash
npm run build
# hoặc
pnpm build
# hoặc
yarn build
```

### Preview production build

```bash
npm run preview
# hoặc
pnpm preview
# hoặc
yarn preview
```

## Cấu trúc dự án

```
cryowebsite/
├── src/
│   ├── api/              # API client và types
│   ├── components/       # React components
│   │   ├── ui/          # UI components cơ bản
│   │   └── layouts/     # Layout components
│   ├── contexts/         # React contexts (Auth)
│   ├── routes/          # TanStack Router routes
│   │   ├── admin/       # Routes cho Admin
│   │   ├── doctor/     # Routes cho Doctor
│   │   ├── lab-technician/  # Routes cho Lab Technician
│   │   └── receptionist/    # Routes cho Receptionist
│   ├── styles/          # Global styles
│   ├── types/           # TypeScript types
│   └── utils/           # Utility functions
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Roles và quyền truy cập

Hệ thống hỗ trợ 4 roles:

1. **Admin (Administrator)**

   - Quyền truy cập đầy đủ
   - Quản lý users, patients, appointments, samples
   - Xem reports và settings

2. **Doctor (Bác sĩ)**

   - Xem và quản lý patients
   - Xem và quản lý appointments
   - Xem và quản lý samples
   - Xem reports

3. **Lab Technician (Kỹ thuật viên Lab)**

   - Xem patients
   - Quản lý samples
   - Xem appointments
   - Xem reports

4. **Receptionist (Lễ tân)**
   - Quản lý patients
   - Quản lý appointments
   - Xem samples

## API Integration

Dự án tích hợp với API từ: https://cryofert.runasp.net/swagger/v1/swagger.json

API client được định nghĩa trong `src/api/client.ts` và sử dụng Axios với:

- Automatic token injection
- Token refresh on 401
- Error handling

## Authentication

- JWT token được lưu trong localStorage
- Token tự động được thêm vào mọi request
- Tự động refresh token khi hết hạn
- Redirect về login khi không authenticated

## Troubleshooting

### Lỗi routeTree.gen.ts không tồn tại

File này sẽ được tự động generate khi chạy `npm run dev`. Nếu gặp lỗi, hãy chạy dev server một lần.

### Lỗi API connection

- Kiểm tra file `.env` có đúng API URL không
- Kiểm tra network connection
- Kiểm tra CORS settings trên server

### Lỗi build

- Xóa `node_modules` và `dist` folder
- Chạy lại `npm install`
- Chạy lại `npm run build`
