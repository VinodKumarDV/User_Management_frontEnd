export type Route = { page: 'login' | 'register' | 'profile' | 'users' | 'edit'; userId?: string };

export const getRoute = (pathname: string): Route => {
    const path = pathname.replace(/\/$/, '') || '/';
    if (path === '/register') return { page: 'register' };
    if (path === '/profile' || path === '/') return { page: 'profile' };
    if (path === '/users') return { page: 'users' };
    const editMatch = path.match(/^\/users\/([^/]+)\/edit$/);
    if (editMatch) return { page: 'edit', userId: editMatch[1] };
    return { page: 'login' };
};
