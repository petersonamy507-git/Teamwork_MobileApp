import { useRef, useState } from 'react';
import { StyleSheet, View, type TextInputInstance } from 'react-native';
import { AppButton, AppInput, AppText } from '../../../components';
import { spacing } from '../../../theme';
import { useAuth } from '../AuthProvider';

/** Email + password form used by the sign-in screen and by "Add account". */
export function LoginForm({ subtitle = 'Sign in with your Crewdesk account', onDone }: { subtitle?: string; onDone?: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const pwRef = useRef<TextInputInstance>(null);

  const submit = async () => {
    if (!email.trim() || !password) return setError('Enter your email and password.');
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      onDone?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.form}>
      <View style={styles.brand}>
        <AppText variant="title" style={{ fontSize: 32 }}>
          Crewdesk
        </AppText>
        <AppText tone="muted">{subtitle}</AppText>
      </View>
      <AppInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="username"
        returnKeyType="next"
        onSubmitEditing={() => pwRef.current?.focus()}
      />
      <AppInput
        ref={pwRef}
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
        error={error}
      />
      <AppButton title="Sign in" onPress={submit} loading={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg, maxWidth: 480, width: '100%', alignSelf: 'center' },
  brand: { gap: spacing.xs, marginBottom: spacing.lg },
});
