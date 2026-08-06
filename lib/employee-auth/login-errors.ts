import { txt } from '@/lib/text';

export type LoginUsernameStatus = 'not_found' | 'inactive' | 'resigned' | 'ok';

export function mapLoginUsernameStatus(status: LoginUsernameStatus): string {
  switch (status) {
    case 'not_found':
      return txt('page.login.accountNotFound');
    case 'inactive':
      return txt('page.login.accountDisabled');
    case 'resigned':
      return txt('page.login.employeeResigned');
    case 'ok':
      return '';
    default:
      return txt('page.login.loginFailed');
  }
}

/** Map Auth.js / Credentials error codes & messages to Vietnamese UI copy. */
export function mapAuthError(raw: string, code?: string | null): string {
  const message = raw.trim();
  const lower = message.toLowerCase();
  const codeLower = (code ?? '').trim().toLowerCase();

  if (
    codeLower === 'account_disabled' ||
    lower.includes('vô hiệu hóa') ||
    lower.includes('account_disabled')
  ) {
    return txt('page.login.accountDisabled');
  }

  if (
    lower === 'configuration' ||
    lower === 'missingsecret' ||
    lower === 'callbackrouteerror' ||
    lower.includes('missing secret')
  ) {
    return txt('page.login.authConfigError');
  }

  if (
    lower === 'credentialssignin' ||
    lower.includes('credentials signin') ||
    lower.includes('invalid login credentials') ||
    lower.includes('invalid email or password')
  ) {
    return txt('page.login.wrongPassword');
  }
  if (lower.includes('email not confirmed')) {
    return 'Email chưa được xác nhận. Liên hệ quản trị.';
  }
  if (lower.includes('user banned') || lower.includes('banned')) {
    return txt('page.login.accountDisabled');
  }
  if (lower.includes('too many requests') || lower.includes('rate limit')) {
    return 'Quá nhiều lần thử. Vui lòng đợi vài phút rồi thử lại.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.';
  }
  if (lower.includes('password should be at least')) {
    return txt('page.login.passwordMin');
  }
  if (lower.includes('user already registered')) {
    return txt('employee.validation.loginNameDuplicate');
  }

  return txt('page.login.loginFailed');
}

export function loginWrongPasswordMessage(): string {
  return txt('page.login.wrongPassword');
}

export function loginEmployeeNotLinkedMessage(): string {
  return txt('page.login.employeeNotLinked');
}
