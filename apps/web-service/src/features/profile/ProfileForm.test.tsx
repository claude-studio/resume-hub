import type { ProfileRow } from '@resume-hub/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const updateMock = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      update: (payload: unknown) => ({
        eq: () => ({
          select: () => ({
            single: () => updateMock(payload),
          }),
        }),
      }),
    }),
  }),
}));

const { ProfileForm } = await import('./ProfileForm');

const baseRow: ProfileRow = {
  user_id: 'u1',
  full_name: '홍길동',
  email: 'gildong@example.com',
  phone: null,
  headline: null,
  summary: null,
  created_at: '2026-04-22T00:00:00.000Z',
  updated_at: '2026-04-22T00:00:00.000Z',
};

function successResponse(overrides: Partial<ProfileRow> = {}) {
  return Promise.resolve({
    data: { ...baseRow, updated_at: '2026-04-22T05:32:00.000Z', ...overrides },
    error: null,
  });
}

beforeEach(() => {
  updateMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ProfileForm (RHF)', () => {
  it('prefills initial values and marks email read-only', () => {
    render(<ProfileForm initial={baseRow} />);
    expect(screen.getByLabelText(/이름/)).toHaveValue('홍길동');
    const email = screen.getByLabelText('이메일');
    expect(email).toHaveValue('gildong@example.com');
    expect(email).toBeDisabled();
  });

  it('marks required field with asterisk and aria-required', () => {
    render(<ProfileForm initial={baseRow} />);
    const name = screen.getByLabelText(/이름/);
    expect(name).toHaveAttribute('aria-required', 'true');
    // Visual asterisk is aria-hidden; sr-only "(필수)" ensures screen reader coverage
    expect(screen.getByLabelText(/이름.*\(필수\)/)).toBe(name);
  });

  it('shows validation error on blur without submit (onTouched)', async () => {
    const user = userEvent.setup();
    render(<ProfileForm initial={baseRow} />);
    const name = screen.getByLabelText(/이름/);
    await user.clear(name);
    await user.tab(); // blur triggers onTouched validation
    const error = await screen.findByText('이름을 입력해주세요');
    expect(error).toHaveAttribute('id', 'fullName-error');
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAttribute('aria-describedby', 'fullName-error');
  });

  it('blocks save when name is invalid and does not call supabase', async () => {
    const user = userEvent.setup();
    render(<ProfileForm initial={baseRow} />);
    const name = screen.getByLabelText(/이름/);
    await user.clear(name);
    await user.click(screen.getByRole('button', { name: /^저장$/ }));
    expect(await screen.findByText('이름을 입력해주세요')).toBeInTheDocument();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('transitions through dirty → saved on successful update', async () => {
    updateMock.mockReturnValueOnce(successResponse({ full_name: '이순신' }));
    const user = userEvent.setup();
    render(<ProfileForm initial={baseRow} />);

    const name = screen.getByLabelText(/이름/);
    await user.clear(name);
    await user.type(name, '이순신');
    expect(screen.getByText('· 변경사항 있음')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^저장$/ }));

    expect(await screen.findByRole('button', { name: '저장됨' })).toBeEnabled();
    expect(updateMock).toHaveBeenCalledTimes(1);
  });

  it('keeps save button enabled on initial render (always-enabled pattern)', () => {
    render(<ProfileForm initial={baseRow} />);
    expect(screen.getByRole('button', { name: /^저장$/ })).toBeEnabled();
  });

  it('skips network call when clicked without changes', async () => {
    const user = userEvent.setup();
    render(<ProfileForm initial={baseRow} />);
    await user.click(screen.getByRole('button', { name: /^저장$/ }));
    expect(await screen.findByRole('button', { name: '저장됨' })).toBeInTheDocument();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('renders summary field with 0/1000 counter when profile has no summary', () => {
    render(<ProfileForm initial={baseRow} />);
    const summary = screen.getByLabelText('자기소개');
    expect(summary).toHaveValue('');
    expect(screen.getByText('0 / 1000')).toBeInTheDocument();
  });

  it('counts summary by code point (emoji = 1 not 2)', async () => {
    const user = userEvent.setup();
    render(<ProfileForm initial={baseRow} />);
    const summary = screen.getByLabelText('자기소개');
    await user.type(summary, '🙂🙂🙂');
    expect(screen.getByText('3 / 1000')).toBeInTheDocument();
  });

  it('shows server error block when update fails and retains values', async () => {
    updateMock.mockReturnValueOnce(Promise.resolve({ data: null, error: { message: 'boom' } }));
    const user = userEvent.setup();
    render(<ProfileForm initial={baseRow} />);

    const name = screen.getByLabelText(/이름/);
    await user.clear(name);
    await user.type(name, '이순신');
    await user.click(screen.getByRole('button', { name: /^저장$/ }));

    // mapSaveError의 fallback 케이스: "저장에 실패했습니다. {error.message}"
    expect(await screen.findByRole('alert')).toHaveTextContent(/저장에 실패했습니다/);
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeEnabled();
    expect(name).toHaveValue('이순신');
  });
});
