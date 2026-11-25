import { useRouter } from 'expo-router';
import { AppScreen } from '../components';
import { LoginForm } from '../features/auth';

/** Sign in to another Crewdesk account without signing out of this one. */
export default function AddAccountScreen() {
  const router = useRouter();
  return (
    <AppScreen scroll padded>
      <LoginForm subtitle="Sign in to another Crewdesk account. You can switch between accounts from your avatar." onDone={() => router.back()} />
    </AppScreen>
  );
}
