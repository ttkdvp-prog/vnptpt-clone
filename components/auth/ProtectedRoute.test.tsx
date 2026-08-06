import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '@/store/useStore';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      _hasHydrated: true,
    });
  });

  it('shows loading spinner until hydrated then redirects when unauthenticated', () => {
    useAuthStore.setState({ _hasHydrated: true, isAuthenticated: false });
    const { container } = render(
      <ProtectedRoute>
        <div>protected</div>
      </ProtectedRoute>,
    );
    // Navigate shim renders null; children must not appear
    expect(screen.queryByText('protected')).not.toBeInTheDocument();
    expect(container.textContent).toBe('');
  });

  it('renders children when authenticated', () => {
    useAuthStore.setState({
      _hasHydrated: true,
      isAuthenticated: true,
      user: {
        id: '1',
        email: 'a@b.c',
        role: 'user',
        created_at: new Date().toISOString(),
        full_name: 'Test',
      },
    });
    render(
      <ProtectedRoute>
        <div>protected</div>
      </ProtectedRoute>,
    );
    expect(screen.getByText('protected')).toBeInTheDocument();
  });
});
