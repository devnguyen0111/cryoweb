import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/unauthorized")({
  component: UnauthorizedComponent,
});

function UnauthorizedComponent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Không có quyền truy cập
          </CardTitle>
          <CardDescription className="text-center">
            Bạn không có quyền truy cập trang này
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            Vui lòng liên hệ quản trị viên nếu bạn cần quyền truy cập.
          </p>
          <Link to="/">
            <Button className="w-full">Về trang chủ</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
