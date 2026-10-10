import { apiRequest, requireRecord } from '../../api/client';
import type { Pagination, User } from '../../components/shared';

const isString = (value: unknown): value is string => typeof value === 'string';

export const parseUser = (value: unknown): User => {
    const user = requireRecord(value, 'The server returned invalid user data.');
    if (
        !isString(user.id) ||
        !isString(user.firstName) ||
        !isString(user.lastName) ||
        !isString(user.email) ||
        (user.status !== 'Active' && user.status !== 'Inactive')
    ) {
        throw new Error('The server returned invalid user data.');
    }
    return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: user.status,
    };
};

export const parseUserResult = (value: unknown): { user: User } => {
    const result = requireRecord(value);
    return { user: parseUser(result.user) };
};

export const parseUsersResult = (value: unknown): { users: User[]; pagination: Pagination } => {
    const result = requireRecord(value);
    const pagination = requireRecord(
        result.pagination,
        'The server returned invalid pagination data.',
    );
    if (
        !Array.isArray(result.users) ||
        !Number.isInteger(pagination.page) ||
        !Number.isInteger(pagination.pageSize) ||
        !Number.isInteger(pagination.total) ||
        !Number.isInteger(pagination.totalPages) ||
        Number(pagination.page) < 1 ||
        Number(pagination.pageSize) < 1 ||
        Number(pagination.total) < 0 ||
        Number(pagination.totalPages) < 0
    ) {
        throw new Error('The server returned invalid directory data.');
    }
    return {
        users: result.users.map(parseUser),
        pagination: {
            page: Number(pagination.page),
            pageSize: Number(pagination.pageSize),
            total: Number(pagination.total),
            totalPages: Number(pagination.totalPages),
        },
    };
};

export const getProfile = () => apiRequest('/api/profile', parseUserResult);

export const getUsers = (params: URLSearchParams) =>
    apiRequest(`/api/users?${params}`, parseUsersResult);

export const getUser = (id: string) => apiRequest(`/api/users/${id}`, parseUserResult);

export const updateUser = (id: string, values: Omit<User, 'id'>) =>
    apiRequest(`/api/users/${id}`, parseUserResult, {
        method: 'PUT',
        body: JSON.stringify(values),
    });
