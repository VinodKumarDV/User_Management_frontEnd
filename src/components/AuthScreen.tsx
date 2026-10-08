import { useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { Brand } from './shared';

type ApiRequest = <T>(path: string, options?: RequestInit) => Promise<T>;

export function AuthScreen({ mode, onNavigate, onAuthenticated, onNotice, notice, request }: {
    mode: 'login' | 'register';
    onNavigate: (path: string) => void;
    onAuthenticated: (token: string) => void;
    onNotice: (message: string) => void;
    notice: string;
    request: ApiRequest;
}) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const isRegister = mode === 'register';

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setBusy(true);
        setError('');
        const data = new FormData(event.currentTarget);
        const body = Object.fromEntries(data.entries());
        try {
            if (isRegister) {
                await request('/api/register', { method: 'POST', body: JSON.stringify(body) });
                onNotice('Account created. Sign in to continue.');
                onNavigate('/login');
            } else {
                const result = await request<{ token: string }>('/api/login', { method: 'POST', body: JSON.stringify(body) });
                onAuthenticated(result.token);
            }
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Unable to continue. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <main className="simple-auth">
            <header className="simple-header">
                <Brand />
                <nav aria-label="Account navigation">
                    <button className={!isRegister ? 'simple-nav-link active' : 'simple-nav-link'} onClick={() => onNavigate('/login')}>Sign in</button>
                    <button className={isRegister ? 'simple-nav-link active' : 'simple-nav-link'} onClick={() => onNavigate('/register')}>Register</button>
                </nav>
            </header>
            <section className="simple-auth-main">
                <div className="auth-form-wrap">
                    <h2>{isRegister ? 'Create account' : 'Sign in'}</h2>
                    <p className="auth-subtitle">{isRegister ? 'Enter your details to register.' : 'Enter your account details.'}</p>
                    {notice && <div className="auth-success" role="status">{notice}</div>}
                    <form className="auth-form" onSubmit={submit}>
                        {isRegister && <div className="form-grid"><label className="field"><span>First name</span><input name="firstName" placeholder="e.g. Alex" autoComplete="given-name" required maxLength={80} /></label><label className="field"><span>Last name</span><input name="lastName" placeholder="e.g. Morgan" autoComplete="family-name" required maxLength={80} /></label></div>}
                        <label className="field"><span>Email address</span><input name="email" type="email" placeholder="you@company.com" autoComplete="email" required maxLength={254} /></label>
                        <label className="field"><span>Password</span><input name="password" type="password" placeholder={isRegister ? 'At least 8 characters' : 'Enter your password'} autoComplete={isRegister ? 'new-password' : 'current-password'} required minLength={isRegister ? 8 : 1} maxLength={128} /></label>
                        {error && <div className="form-error" role="alert">{error}</div>}
                        <button className="button button-primary auth-submit" disabled={busy}>{busy ? (isRegister ? 'Creating account…' : 'Signing in…') : (isRegister ? 'Create account' : 'Sign in')}<ArrowRight size={17} /></button>
                    </form>
                    <div className="auth-switch">{isRegister ? 'Already registered?' : 'Need an account?'} <button onClick={() => onNavigate(isRegister ? '/login' : '/register')}>{isRegister ? 'Sign in' : 'Register'}</button></div>
                </div>
            </section>
        </main>
    );
}