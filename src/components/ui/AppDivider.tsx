import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';

export function AppDivider({ inset = 0 }: { inset?: number }) {
  const { colors } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: inset }} />;
}
