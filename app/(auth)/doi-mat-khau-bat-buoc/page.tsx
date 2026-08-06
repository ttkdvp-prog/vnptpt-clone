'use client';
import ForceChangePassword from '@/views/ForceChangePassword';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
export default function Page() {
  return <ProtectedRoute><ForceChangePassword /></ProtectedRoute>;
}
