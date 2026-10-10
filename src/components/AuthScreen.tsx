import { useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { login, register } from '../features/auth/api';
import { Brand } from './shared';

export function AuthScreen({
    mode,
    onNavigate,
    onAuthenticated,
    onNotice,
    notice,
}: {
    mode: 'login' | 'register';
    onNavigate: (path: string) => void;
    onAuthenticated: (token: string) => void;
    onNotice: (message: string) => void;
    notice: string;
}) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const isRegister = mode === 'register';

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setBusy(true);
        setError('');
        const data = new FormData(event.currentTarget);
        const email = String(data.get('email') ?? '').trim();
        const password = String(data.get('password') ?? '');
        const firstName = String(data.get('firstName') ?? '').trim();
        const lastName = String(data.get('lastName') ?? '').trim();
        if (isRegister && (!firstName || !lastName)) {
            setError('Enter a first and last name.');
            return;
        }
        try {
            if (isRegister) {
                await register({
                    firstName,
                    lastName,
                    email,
                    password,
                });
                onNotice('Account created. Sign in to continue.');
                onNavigate('/login');
            } else {
                const result = await login({ email, password });
                onAuthenticated(result.token);
            }
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : 'Unable to continue. Please try again.',
            );
        } finally {
            setBusy(false);
        }
    };

    return (
        <main className="simple-auth">
            <header className="simple-header">
                <Brand />
                <nav aria-label="Account navigation">
                    <button
                        className={!isRegister ? 'simple-nav-link active' : 'simple-nav-link'}
                        onClick={() => onNavigate('/login')}
                    >
                        Sign in
                    </button>
                    <button
                        className={isRegister ? 'simple-nav-link active' : 'simple-nav-link'}
                        onClick={() => onNavigate('/register')}
                    >
                        Register
                    </button>
                </nav>
            </header>
            <section className="simple-auth-main">
                <div className="auth-form-wrap">
                    <h2>{isRegister ? 'Create account' : 'Sign in'}</h2>
                    <p className="auth-subtitle">
                        {isRegister
                            ? 'Enter your details to register.'
                            : 'Enter your account details.'}
                    </p>
                    {notice && (
                        <div className="auth-success" role="status">
                            {notice}
                        </div>
                    )}
                    <form className="auth-form" onSubmit={submit}>
                        {isRegister && (
                            <div className="form-grid">
                                <label className="field">
                                    <span>First name</span>
                                    <input
                                        name="firstName"
                                        placeholder="e.g. Alex"
                                        autoComplete="given-name"
                                        required
                                        maxLength={80}
                                    />
                                </label>
                                <label className="field">
                                    <span>Last name</span>
                                    <input
                                        name="lastName"
                                        placeholder="e.g. Morgan"
                                        autoComplete="family-name"
                                        required
                                        maxLength={80}
                                    />
                                </label>
                            </div>
                        )}
                        <label className="field">
                            <span>Email address</span>
                            <input
                                name="email"
                                type="email"
                                placeholder="you@company.com"
                                autoComplete="email"
                                required
                                maxLength={254}
                            />
                        </label>
                        <label className="field">
                            <span>Password</span>
                            <input
                                name="password"
                                type="password"
                                placeholder={
                                    isRegister ? 'At least 8 characters' : 'Enter your password'
                                }
                                autoComplete={isRegister ? 'new-password' : 'current-password'}
                                required
                                minLength={isRegister ? 8 : 1}
                                maxLength={128}
                            />
                        </label>
                        {error && (
                            <div className="form-error" role="alert">
                                {error}
                            </div>
                        )}
                        <button className="button button-primary auth-submit" disabled={busy}>
                            {busy
                                ? isRegister
                                    ? 'Creating account…'
                                    : 'Signing in…'
                                : isRegister
                                  ? 'Create account'
                                  : 'Sign in'}
                            <ArrowRight size={17} />
                        </button>
                    </form>
                    <div className="auth-switch">
                        {isRegister ? 'Already registered?' : 'Need an account?'}{' '}
                        <button onClick={() => onNavigate(isRegister ? '/login' : '/register')}>
                            {isRegister ? 'Sign in' : 'Register'}
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
}
