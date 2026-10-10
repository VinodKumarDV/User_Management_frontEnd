import { describe, expect, it } from 'vitest';
import { parseUser, parseUsersResult } from './api';

const validUser = {
    id: 'user-1',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    status: 'Active',
};

describe('user API response validation', () => {
    it('accepts a complete user and rejects malformed user data', () => {
        expect(parseUser(validUser)).toEqual(validUser);
        expect(() => parseUser({ ...validUser, status: 'Pending' })).toThrow('invalid user data');
        expect(() => parseUser(null)).toThrow('invalid user data');
    });

    it('validates directory rows and pagination together', () => {
        expect(
            parseUsersResult({
                users: [validUser],
                pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
            }),
        ).toEqual({
            users: [validUser],
            pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
        });
        expect(() =>
            parseUsersResult({
                users: [{ ...validUser, email: 10 }],
                pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
            }),
        ).toThrow('invalid user data');
        expect(() =>
            parseUsersResult({
                users: [],
                pagination: { page: 0, pageSize: 10, total: 0, totalPages: 0 },
            }),
        ).toThrow('invalid directory data');
    });
});
