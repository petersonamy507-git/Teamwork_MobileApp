import { StyleSheet } from 'react-native';
import { AppScreen } from '../components';
import { LoginForm } from '../features/auth';

export default function LoginScreen() {
  return (
    <AppScreen scroll padded edges={['top', 'bottom', 'left', 'right']} contentStyle={styles.wrap}>
      <LoginForm />
    </AppScreen>
  );
}

const styles = StyleSheet.create({ wrap: { flexGrow: 1, justifyContent: 'center' } });
