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

describe('ProfileForm', () => {
  it('prefills initial values and marks email read-only', () => {
    render(<ProfileForm initial={baseRow} />);
    expect(screen.getByLabelText('이름')).toHaveValue('홍길동');
    const email = screen.getByLabelText('이메일');
    expect(email).toHaveValue('gildong@example.com');
    expect(email).toBeDisabled();
  });

  it('blocks save when name is cleared and shows aria-connected error', async () => {
    const user = userEvent.setup();
    render(<ProfileForm initial={baseRow} />);

    const name = screen.getByLabelText('이름');
    await user.clear(name);
    const saveButton = screen.getByRole('button', { name: /^저장$/ });
    await user.click(saveButton);

    const error = await screen.findByText('이름을 입력해주세요');
    expect(error).toHaveAttribute('id', 'fullName-error');
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAttribute('aria-describedby', 'fullName-error');
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('transitions through dirty → saved on successful update', async () => {
    updateMock.mockReturnValueOnce(successResponse({ full_name: '이순신' }));
    const user = userEvent.setup();
    render(<ProfileForm initial={baseRow} />);

    const name = screen.getByLabelText('이름');
    await user.clear(name);
    await user.type(name, '이순신');

    expect(screen.getByText('· 변경사항 있음')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^저장$/ }));

    expect(await screen.findByRole('button', { name: '저장됨' })).toBeDisabled();
    expect(updateMock).toHaveBeenCalledTimes(1);
  });

  it('shows server error block when update fails and retains values', async () => {
    updateMock.mockReturnValueOnce(Promise.resolve({ data: null, error: { message: 'boom' } }));
    const user = userEvent.setup();
    render(<ProfileForm initial={baseRow} />);

    const name = screen.getByLabelText('이름');
    await user.clear(name);
    await user.type(name, '이순신');
    await user.click(screen.getByRole('button', { name: /^저장$/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('저장에 실패했습니다');
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeEnabled();
    expect(name).toHaveValue('이순신');
  });
});
