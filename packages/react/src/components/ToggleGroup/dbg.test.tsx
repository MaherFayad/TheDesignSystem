import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { it } from 'vitest';
import { ToggleGroup, ToggleGroupItem } from './index';
it('dbg', async () => {
  console.log('START');
  render(
    <ToggleGroup type="single" aria-label="X" defaultValue="list">
      <ToggleGroupItem value="list">List</ToggleGroupItem>
      <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
    </ToggleGroup>,
  );
  await Promise.resolve();
  console.log('AFTER');
  await userEvent.click(screen.getByRole('radio', { name: 'Grid' }));
  console.log('END');
  throw new Error('show');
});
it('fail', () => { throw new Error('show'); });
