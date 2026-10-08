import { useEffect, useState } from 'react';
import { Check, LogOut } from 'lucide-react';
import { AuthScreen } from './components/AuthScreen';
import { EditPage } from './components/EditPage';
import { ProfilePage } from './components/ProfilePage';
import { UsersPage } from './components/UsersPage';
import { Brand, type Pagination, type User } from './components/shared';
import './App.css';

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
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | User['status']>('all');
    const [directoryPage, setDirectoryPage] = useState(1);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
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
        const timer = window.setTimeout(() => {
            setSearch(filter.trim());
            setDirectoryPage(1);
        }, 250);
        return () => window.clearTimeout(timer);
    }, [filter]);

    useEffect(() => {
        if (!token || activeRoute.page === 'login' || activeRoute.page === 'register') return;
        let current = true;
        const load = async () => {
            setBusy(true);
            try {
                if (activeRoute.page === 'profile') {
                    const result = await apiRequest<{ user: User }>('/api/profile');
                    if (current) setProfile(result.user);
                } else if (activeRoute.page === 'users') {
                    const params = new URLSearchParams({ page: String(directoryPage), pageSize: String(pagination.pageSize) });
                    if (search) params.set('search', search);
                    if (statusFilter !== 'all') params.set('status', statusFilter);
                    const result = await apiRequest<{ users: User[]; pagination: Pagination }>(`/api/users?${params}`);
                    if (current) {
                        setUsers(result.users);
                        setPagination(result.pagination);
                    }
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
    }, [token, activeRoute.page, activeRoute.userId, directoryPage, pagination.pageSize, search, statusFilter]);

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
                request={apiRequest}
            />
        );
    }

    return (
        <div className="app-shell">
            <header className="app-header">
                <Brand />
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
                            users={users}
                            filter={filter}
                            onFilter={setFilter}
                            statusFilter={statusFilter}
                            onStatusFilter={(value) => { setStatusFilter(value); setDirectoryPage(1); }}
                            pagination={pagination}
                            onPageChange={setDirectoryPage}
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

export default App;