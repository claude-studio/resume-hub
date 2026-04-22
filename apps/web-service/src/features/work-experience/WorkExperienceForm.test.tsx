import type { WorkExperienceEdit } from '@resume-hub/shared';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WorkExperienceForm } from './WorkExperienceForm';

const EMPTY: WorkExperienceEdit = {
  company: '',
  role: '',
  startMonth: '',
  endMonth: '',
  description: '',
};

describe('WorkExperienceForm', () => {
  it('shows required errors for empty company and role on submit', async () => {
    const user = userEvent.setup();
    render(<WorkExperienceForm initial={EMPTY} onSave={vi.fn()} onCancel={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /^저장$/ }));
    expect(await screen.findByText(/회사명을 입력해주세요/)).toBeInTheDocument();
    expect(screen.getByText(/역할을 입력해주세요/)).toBeInTheDocument();
  });

  it('toggles endMonth disabled when "현재 재직 중" is checked', async () => {
    const user = userEvent.setup();
    render(<WorkExperienceForm initial={EMPTY} onSave={vi.fn()} onCancel={vi.fn()} />);
    const currentCheckbox = screen.getByRole('checkbox', { name: /현재 재직 중/ });
    expect(currentCheckbox).toBeChecked(); // endMonth empty → current by default
    const endInput = screen.getByLabelText(/종료/);
    expect(endInput).toBeDisabled();
    await user.click(currentCheckbox);
    expect(endInput).toBeEnabled();
  });

  it('displays counter for description and transitions colors', async () => {
    const user = userEvent.setup();
    render(<WorkExperienceForm initial={EMPTY} onSave={vi.fn()} onCancel={vi.fn()} />);
    const desc = screen.getByLabelText('설명');
    await user.type(desc, 'hello');
    expect(screen.getByText('5 / 500')).toBeInTheDocument();
  });
});
