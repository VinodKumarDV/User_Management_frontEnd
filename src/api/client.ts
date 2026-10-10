type ApiErrorPayload = { message?: unknown };

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

export async function apiRequest<T>(
    path: string,
    parse: (value: unknown) => T,
    options: RequestInit = {},
): Promise<T> {
    const token = localStorage.getItem('user-management-token');
    const headers = new Headers(options.headers);
    if (options.body) headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);

    let response: Response;
    try {
        response = await fetch(`${import.meta.env.VITE_API_URL ?? ''}${path}`, {
            ...options,
            headers,
        });
    } catch {
        throw new Error('Unable to reach the server. Check your connection and try again.');
    }

    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
        const message = isRecord(payload) ? (payload as ApiErrorPayload).message : undefined;
        throw new Error(
            typeof message === 'string' ? message : 'Something went wrong. Please try again.',
        );
    }

    return parse(payload);
}

export const requireRecord = (
    value: unknown,
    message = 'The server returned an invalid response.',
) => {
    if (!isRecord(value)) throw new Error(message);
    return value;
};
