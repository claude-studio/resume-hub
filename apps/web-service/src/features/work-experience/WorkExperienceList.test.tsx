import type { WorkExperienceRow } from '@resume-hub/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const insertMock = vi.fn();
const updateMock = vi.fn();
const deleteMock = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      insert: (payload: unknown) => ({
        select: () => ({
          single: () => insertMock(payload),
        }),
      }),
      update: (payload: unknown) => ({
        eq: () => ({
          select: () => ({
            single: () => updateMock(payload),
          }),
        }),
      }),
      delete: () => ({
        eq: () => deleteMock(),
      }),
    }),
  }),
}));

const { WorkExperienceList } = await import('./WorkExperienceList');

function makeRow(overrides: Partial<WorkExperienceRow> = {}): WorkExperienceRow {
  return {
    id: 'w-1',
    user_id: 'u1',
    company: 'Acme Corp',
    role: 'Senior Engineer',
    start_date: '2023-01-01',
    end_date: '2024-06-01',
    description: 'Led backend migration.',
    created_at: '2026-04-22T00:00:00Z',
    updated_at: '2026-04-22T00:00:00Z',
    ...overrides,
  };
}

beforeEach(() => {
  insertMock.mockReset();
  updateMock.mockReset();
  deleteMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('WorkExperienceList', () => {
  it('renders empty state with add CTA when initial is empty', () => {
    render(<WorkExperienceList initial={[]} userId="u1" />);
    expect(screen.getByText(/아직 경력이 없습니다/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ 경력 추가/ })).toBeEnabled();
  });

  it('renders existing items sorted (current first, then reverse-chronological)', () => {
    const rows = [
      makeRow({ id: 'a', company: 'Acme', start_date: '2020-01-01', end_date: '2021-12-01' }),
      makeRow({ id: 'b', company: 'Beta', start_date: '2024-03-01', end_date: null }),
      makeRow({ id: 'c', company: 'Cedar', start_date: '2022-05-01', end_date: '2024-01-01' }),
    ];
    render(<WorkExperienceList initial={rows} userId="u1" />);
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(['Beta', 'Cedar', 'Acme']);
  });

  it('disables add button when limit reached (50 items)', () => {
    const rows = Array.from({ length: 50 }, (_, i) =>
      makeRow({ id: `w-${i}`, start_date: `${2000 + i}-01-01`, end_date: `${2001 + i}-01-01` }),
    );
    render(<WorkExperienceList initial={rows} userId="u1" />);
    const addBtn = screen.getByRole('button', { name: /\+ 경력 추가/ });
    expect(addBtn).toBeDisabled();
    expect(screen.getByText(/최대 50건까지 등록 가능합니다/)).toBeInTheDocument();
  });

  it('opens inline add form and calls insert on save', async () => {
    insertMock.mockResolvedValueOnce({
      data: makeRow({
        id: 'new',
        company: '이력허브',
        role: 'Eng',
        start_date: '2024-01-01',
        end_date: null,
      }),
      error: null,
    });
    const user = userEvent.setup();
    render(<WorkExperienceList initial={[]} userId="u1" />);
    await user.click(screen.getByRole('button', { name: /\+ 경력 추가/ }));
    await user.type(screen.getByLabelText(/회사/), '이력허브');
    await user.type(screen.getByLabelText(/역할/), 'Eng');
    // Native month input: type directly
    const start = screen.getByLabelText(/시작/);
    await user.type(start, '2024-01');
    await user.click(screen.getByRole('button', { name: /^저장$/ }));
    expect(insertMock).toHaveBeenCalledTimes(1);
  });
});
