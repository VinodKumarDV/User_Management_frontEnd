import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from './client';

describe('API client failures', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('preserves a server-provided error message', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: false,
                json: async () => ({ message: 'Access denied.' }),
            }),
        );

        await expect(apiRequest('/api/private', (value) => value)).rejects.toThrow(
            'Access denied.',
        );
    });

    it('normalizes connection failures', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));

        await expect(apiRequest('/api/private', (value) => value)).rejects.toThrow(
            'Unable to reach the server.',
        );
    });
});
