import { describe, expect, it } from 'vitest';
import { getRoute } from './routes';

describe('route parsing', () => {
    it('recognizes account and directory pages with trailing slashes', () => {
        expect(getRoute('/register/')).toEqual({ page: 'register' });
        expect(getRoute('/users/')).toEqual({ page: 'users' });
        expect(getRoute('/')).toEqual({ page: 'profile' });
    });

    it('extracts edit IDs and sends unknown paths to sign in', () => {
        expect(getRoute('/users/abc-123/edit')).toEqual({ page: 'edit', userId: 'abc-123' });
        expect(getRoute('/missing')).toEqual({ page: 'login' });
    });
});
