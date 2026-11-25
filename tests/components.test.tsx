import { fireEvent, render, screen } from '@testing-library/react-native';
import { AppButton } from '../src/components/ui/AppButton';
import { AppCheckbox } from '../src/components/ui/AppCheckbox';
import { AppEmptyState } from '../src/components/feedback/AppEmptyState';
import { ThemeProvider } from '../src/theme';

const wrap = async (ui: React.ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

describe('shared UI components', () => {
  it('AppButton fires onPress and exposes an accessible label', async () => {
    const onPress = jest.fn();
    await wrap(<AppButton title="Sign in" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('AppButton does not fire while loading', async () => {
    const onPress = jest.fn();
    await wrap(<AppButton title="Save" onPress={onPress} loading />);
    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('AppCheckbox reports its checked state', async () => {
    const onToggle = jest.fn();
    await wrap(<AppCheckbox checked label="Complete task" onToggle={onToggle} />);
    const box = screen.getByRole('checkbox', { name: 'Complete task' });
    expect(box.props.accessibilityState.checked).toBe(true);
    await fireEvent.press(box);
    expect(onToggle).toHaveBeenCalled();
  });

  it('AppEmptyState renders title and message', async () => {
    await wrap(<AppEmptyState title="No Tasks" message="No tasks have been found." />);
    expect(screen.getByText('No Tasks')).toBeTruthy();
    expect(screen.getByText('No tasks have been found.')).toBeTruthy();
  });
});
