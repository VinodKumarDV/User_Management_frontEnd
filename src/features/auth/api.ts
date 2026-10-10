import { apiRequest, requireRecord } from '../../api/client';
import { parseUser } from '../users/api';

export type Credentials = { email: string; password: string };
export type Registration = Credentials & { firstName: string; lastName: string };

export type LoginResult = { token: string };

export const parseLoginResult = (value: unknown): LoginResult => {
    const result = requireRecord(value);
    if (typeof result.token !== 'string' || !result.token) {
        throw new Error('The server returned an invalid sign-in response.');
    }
    return { token: result.token };
};

export async function login(credentials: Credentials): Promise<LoginResult> {
    return apiRequest('/api/login', parseLoginResult, {
        method: 'POST',
        body: JSON.stringify(credentials),
    });
}

export async function register(registration: Registration): Promise<void> {
    await apiRequest(
        '/api/register',
        (value) => {
            const result = requireRecord(value);
            if (typeof result.message !== 'string') {
                throw new Error('The server returned an invalid registration response.');
            }
            parseUser(result.user);
        },
        {
            method: 'POST',
            body: JSON.stringify(registration),
        },
    );
}
