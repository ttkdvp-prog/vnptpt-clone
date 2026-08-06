'use client';
import Register from '@/views/Register';
import { RegisterRouteGuard } from '@/components/auth/ProtectedRoute';
export default function Page() {
  return <RegisterRouteGuard><Register /></RegisterRouteGuard>;
}
