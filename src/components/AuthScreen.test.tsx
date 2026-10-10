import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { login, register } from '../features/auth/api';
import { AuthScreen } from './AuthScreen';

vi.mock('../features/auth/api', () => ({
    login: vi.fn(),
    register: vi.fn(),
}));

const renderLogin = (onAuthenticated = vi.fn()) =>
    render(
        <AuthScreen
            mode="login"
            onNavigate={vi.fn()}
            onAuthenticated={onAuthenticated}
            onNotice={vi.fn()}
            notice=""
        />,
    );

const renderRegistration = () =>
    render(
        <AuthScreen
            mode="register"
            onNavigate={vi.fn()}
            onAuthenticated={vi.fn()}
            onNotice={vi.fn()}
            notice=""
        />,
    );

describe('sign-in flow', () => {
    beforeEach(() => vi.clearAllMocks());
    afterEach(cleanup);

    it('submits credentials and authenticates with the returned token', async () => {
        const onAuthenticated = vi.fn();
        vi.mocked(login).mockResolvedValue({ token: 'session-token' });
        const user = userEvent.setup();
        renderLogin(onAuthenticated);

        await user.type(screen.getByLabelText('Email address'), 'ada@example.com');
        await user.type(screen.getByLabelText('Password'), 'secret-password');
        await user.click(screen.getAllByRole('button', { name: 'Sign in' })[1]);

        await waitFor(() => expect(onAuthenticated).toHaveBeenCalledWith('session-token'));
        expect(login).toHaveBeenCalledWith({
            email: 'ada@example.com',
            password: 'secret-password',
        });
    });

    it('shows API errors and lets the user retry', async () => {
        vi.mocked(login).mockRejectedValue(new Error('Email or password is incorrect.'));
        renderLogin();

        fireEvent.change(screen.getByLabelText('Email address'), {
            target: { value: 'ada@example.com' },
        });
        fireEvent.change(screen.getByLabelText('Password'), {
            target: { value: 'wrong-password' },
        });
        fireEvent.click(screen.getAllByRole('button', { name: 'Sign in' })[1]);

        expect((await screen.findByRole('alert')).textContent).toContain(
            'Email or password is incorrect.',
        );
    });

    it('rejects whitespace-only registration names before making an API request', async () => {
        renderRegistration();
        const user = userEvent.setup();
        await user.type(screen.getByLabelText('First name'), '   ');
        await user.type(screen.getByLabelText('Last name'), 'Lovelace');
        await user.type(screen.getByLabelText('Email address'), 'ada@example.com');
        await user.type(screen.getByLabelText('Password'), 'secret-password');
        await user.click(screen.getByRole('button', { name: 'Create account' }));

        expect((await screen.findByRole('alert')).textContent).toContain(
            'Enter a first and last name.',
        );
        expect(register).not.toHaveBeenCalled();
    });
});
