import { useEffect, useState, type FormEvent } from 'react';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    LogOut,
    Mail,
    Pencil,
    Search,
} from 'lucide-react';
import './App.css';

type User = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: 'Active' | 'Inactive';
};

type Route = { page: 'login' | 'register' | 'profile' | 'users' | 'edit'; userId?: string };
type ApiResult<T> = T & { message?: string };

const API_URL = import.meta.env.VITE_API_URL ?? '';

const getRoute = (): Route => {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    if (path === '/register') return { page: 'register' };
    if (path === '/profile' || path === '/') return { page: 'profile' };
    if (path === '/users') return { page: 'users' };
    const editMatch = path.match(/^\/users\/([^/]+)\/edit$/);
    if (editMatch) return { page: 'edit', userId: editMatch[1] };
    return { page: 'login' };
};

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('user-management-token');
    const headers = new Headers(options.headers);
    if (options.body) headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const response = await fetch(`${API_URL}${path}`, { ...options, headers });
    const result = (await response.json().catch(() => ({}))) as ApiResult<T>;
    if (!response.ok) throw new Error(result.message ?? 'Something went wrong. Please try again.');
    return result;
}

function App() {
    const [route, setRoute] = useState<Route>(getRoute);
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('user-management-token'));
    const [profile, setProfile] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [filter, setFilter] = useState('');
    const [busy, setBusy] = useState(true);
    const [pageError, setPageError] = useState('');
    const [toast, setToast] = useState('');
    const activeRoute: Route = !token && route.page !== 'login' && route.page !== 'register'
        ? { page: 'login' }
        : token && (route.page === 'login' || route.page === 'register')
            ? { page: 'profile' }
            : route;

    const navigate = (path: string) => {
        window.history.pushState({}, '', path);
        setRoute(getRoute());
        setBusy(true);
        setPageError('');
    };

    useEffect(() => {
        const onPopState = () => setRoute(getRoute());
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);

    useEffect(() => {
        if (!token || activeRoute.page === 'login' || activeRoute.page === 'register') return;
        let current = true;
        const load = async () => {
            try {
                if (activeRoute.page === 'profile') {
                    const result = await apiRequest<{ user: User }>('/api/profile');
                    if (current) setProfile(result.user);
                } else if (activeRoute.page === 'users') {
                    const result = await apiRequest<{ users: User[] }>('/api/users');
                    if (current) setUsers(result.users);
                } else if (activeRoute.page === 'edit' && activeRoute.userId) {
                    const result = await apiRequest<{ user: User }>(`/api/users/${activeRoute.userId}`);
                    if (current) setEditingUser(result.user);
                }
            } catch (error) {
                if (!current) return;
                const message = error instanceof Error ? error.message : 'Unable to load this page.';
                if (message.toLowerCase().includes('session')) {
                    localStorage.removeItem('user-management-token');
                    setToken(null);
                }
                setPageError(message);
            } finally {
                if (current) setBusy(false);
            }
        };
        void load();
        return () => {
            current = false;
        };
    }, [token, activeRoute.page, activeRoute.userId]);

    useEffect(() => {
        if (!toast) return;
        const timer = window.setTimeout(() => setToast(''), 3200);
        return () => window.clearTimeout(timer);
    }, [toast]);

    const signOut = () => {
        localStorage.removeItem('user-management-token');
        setToken(null);
        setProfile(null);
        navigate('/login');
    };

    const onAuthenticated = (nextToken: string) => {
        localStorage.setItem('user-management-token', nextToken);
        setToken(nextToken);
        navigate('/profile');
    };

    if (activeRoute.page === 'login' || activeRoute.page === 'register') {
        return (
            <AuthScreen
                mode={activeRoute.page}
                onNavigate={navigate}
                onAuthenticated={onAuthenticated}
                onNotice={setToast}
                notice={toast}
            />
        );
    }

    const visibleUsers = users.filter((user) =>
        `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(filter.toLowerCase()),
    );

    return (
        <div className="app-shell">
            <header className="app-header">
                <nav className="app-nav" aria-label="Main navigation">
                    <button className={activeRoute.page === 'profile' ? 'app-nav-link active' : 'app-nav-link'} onClick={() => navigate('/profile')}>Profile</button>
                    <button className={activeRoute.page === 'users' || activeRoute.page === 'edit' ? 'app-nav-link active' : 'app-nav-link'} onClick={() => navigate('/users')}>Users</button>
                </nav>
                <div className="app-account">
                    <button className="button button-secondary" onClick={signOut}><LogOut size={15} /> Sign out</button>
                </div>
            </header>
            <main className="main-area">
                <div className="page-content">
                    {activeRoute.page === 'profile' && <ProfilePage user={profile} busy={busy} onEdit={() => profile && navigate(`/users/${profile.id}/edit`)} />}
                    {activeRoute.page === 'users' && (
                        <UsersPage
                            users={visibleUsers}
                            filter={filter}
                            onFilter={setFilter}
                            onEdit={(id) => { setEditingUser(null); navigate(`/users/${id}/edit`); }}
                            busy={busy}
                        />
                    )}
                    {activeRoute.page === 'edit' && (
                        <EditPage
                            user={editingUser?.id === activeRoute.userId ? editingUser : null}
                            busy={busy}
                            error={pageError}
                            onCancel={() => navigate('/users')}
                            onSave={async (values) => {
                                if (!activeRoute.userId) return;
                                setBusy(true);
                                setPageError('');
                                try {
                                    await apiRequest(`/api/users/${activeRoute.userId}`, { method: 'PUT', body: JSON.stringify(values) });
                                    if (profile?.id === activeRoute.userId) setProfile({ ...profile, ...values });
                                    setToast('Changes saved');
                                    navigate('/users');
                                } catch (error) {
                                    setPageError(error instanceof Error ? error.message : 'Unable to save changes.');
                                } finally {
                                    setBusy(false);
                                }
                            }}
                        />
                    )}
                    {pageError && activeRoute.page !== 'edit' && <div className="page-alert" role="alert">{pageError}</div>}
                </div>
            </main>
            {toast && <div className="toast" role="status"><Check size={17} />{toast}</div>}
        </div>
    );
}

function ProfilePage({ user, busy, onEdit }: { user: User | null; busy: boolean; onEdit: () => void }) {
    return (
        <>
            <PageHeading eyebrow="ACCOUNT" title="My profile" />
            {busy && !user ? <LoadingState /> : user ? (
                <section className="profile-layout">
                    <div className="profile-summary">
                        <div><h2>{user.firstName} {user.lastName}</h2><p>{user.email}</p></div>
                    </div>
                    <div className="detail-section">
                        <div className="section-heading"><div>
                            <h3>Personal information</h3>
                        </div><button className="button button-secondary" onClick={onEdit}><Pencil size={15} /> Edit profile</button>
                        </div>
                        <div className="detail-grid">
                            <Detail label="First name" value={user.firstName} />
                            <Detail label="Last name" value={user.lastName} />
                            <Detail label="Email address" value={user.email} />
                            <div className="detail-item"><span className="detail-label">Account status</span><StatusBadge status={user.status} /></div>
                        </div>
                    </div>
                </section>
            ) : <EmptyState message="Your profile could not be loaded." />}
        </>
    );
}

function UsersPage({ users, filter, onFilter, onEdit, busy }: {
    users: User[];
    filter: string;
    onFilter: (value: string) => void;
    onEdit: (id: string) => void;
    busy: boolean;
}) {
    return (
        <>
            <div className="page-heading"><h1>People</h1></div>
            <div className="directory-meta">
                <label className="search-field">
                    <Search size={17} /><input value={filter} onChange={(event) => onFilter(event.target.value)} placeholder="Search people" aria-label="Search people" />
                </label>
            </div>
            <section className="table-wrap" aria-label="Users">
                <table>
                    <thead><tr><th>ID</th><th>PERSON</th><th>EMAIL</th><th>STATUS</th><th className="action-column">ACTION</th></tr></thead>
                    <tbody>
                        {busy ? <tr><td colSpan={5}><LoadingState /></td></tr> : users.length ? users.map((user) => (
                            <tr key={user.id}>
                                <td className="id-cell">{user.id}</td>
                                <td><strong>{user.firstName} {user.lastName}</strong></td>
                                <td className="email-cell">{user.email}</td>
                                <td><StatusBadge status={user.status} /></td>
                                <td className="action-column"><button className="icon-button edit-action" onClick={() => onEdit(user.id)} aria-label={`Edit ${user.firstName} ${user.lastName}`} title="Edit person"><Pencil size={16} /></button></td>
                            </tr>
                        )) : <tr><td colSpan={5}><EmptyState message={filter ? 'No people match your search.' : 'No people have been added yet.'} /></td></tr>}
                    </tbody>
                </table>
            </section>
        </>
    );
}

function EditPage({ user, busy, error, onCancel, onSave }: {
    user: User | null;
    busy: boolean;
    error: string;
    onCancel: () => void;
    onSave: (values: Pick<User, 'firstName' | 'lastName' | 'email' | 'status'>) => Promise<void>;
}) {
    const [localError, setLocalError] = useState('');
    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const values = new FormData(event.currentTarget);
        const firstName = String(values.get('firstName') ?? '').trim();
        const lastName = String(values.get('lastName') ?? '').trim();
        const email = String(values.get('email') ?? '').trim();
        const status = String(values.get('status') ?? 'Active') as User['status'];
        if (!firstName || !lastName || !email) {
            setLocalError('Complete all fields before saving.');
            return;
        }
        setLocalError('');
        await onSave({ firstName, lastName, email, status });
    };

    return (
        <>
            <PageHeading eyebrow="DIRECTORY / EDIT" title="Edit person" description="Update profile details and account access." />
            {busy && !user ? <LoadingState /> : user ? (
                <form className="edit-form" onSubmit={submit}>
                    <div className="edit-form-head"><div className="edit-person"><div><strong>{user.firstName} {user.lastName}</strong><span>{user.email}</span></div></div></div>
                    <div className="form-grid">
                        <label className="field"><span>First name</span><input name="firstName" defaultValue={user.firstName} required maxLength={80} autoComplete="given-name" /></label>
                        <label className="field"><span>Last name</span><input name="lastName" defaultValue={user.lastName} required maxLength={80} autoComplete="family-name" /></label>
                        <label className="field field-full"><span>Email address</span><input name="email" type="email" defaultValue={user.email} required maxLength={254} autoComplete="email" /></label>
                        <fieldset className="status-field field-full"><legend>Account status</legend><div className="status-options"><label><input type="radio" name="status" value="Active" defaultChecked={user.status === 'Active'} /><span className="radio-dot" /><span><strong>Active</strong></span></label><label><input type="radio" name="status" value="Inactive" defaultChecked={user.status === 'Inactive'} /><span className="radio-dot" /><span><strong>Inactive</strong></span></label></div></fieldset>
                    </div>
                    {(localError || error) && <div className="form-error" role="alert">{localError || error}</div>}
                    <div className="form-actions"><button type="button" className="button button-secondary" onClick={onCancel}><ArrowLeft size={16} /> Cancel</button><button type="submit" className="button button-primary" disabled={busy}><Check size={16} /> {busy ? 'Saving...' : 'Save changes'}</button></div>
                </form>
            ) : <EmptyState message={error || 'This person could not be found.'} />}
        </>
    );
}

function AuthScreen({ mode, onNavigate, onAuthenticated, onNotice, notice }: {
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
        const body = Object.fromEntries(data.entries());
        try {
            if (isRegister) {
                await apiRequest('/api/register', { method: 'POST', body: JSON.stringify(body) });
                onNotice('Account created. Sign in to continue.');
                onNavigate('/login');
            } else {
                const result = await apiRequest<{ token: string }>('/api/login', { method: 'POST', body: JSON.stringify(body) });
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

function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
    return <div className="page-heading"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>;
}

function Detail({ label, value }: { label: string; value: string }) {
    return <div className="detail-item"><span className="detail-label">{label}</span><span className="detail-value">{value}</span></div>;
}

function StatusBadge({ status }: { status: User['status'] }) {
    return <span className="status-badge">{status}</span>;
}

function LoadingState() {
    return <div className="loading-state"><span className="loading-dot" /> Loading…</div>;
}

function EmptyState({ message }: { message: string }) {
    return <div className="empty-state"><Mail size={21} /><p>{message}</p></div>;
}

export default App;