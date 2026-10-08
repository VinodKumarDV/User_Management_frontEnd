import { useState, type FormEvent } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { EmptyState, LoadingState, PageHeading, type User } from './shared';

type UserValues = Pick<User, 'firstName' | 'lastName' | 'email' | 'status'>;

export function EditPage({ user, busy, error, onCancel, onSave }: {
    user: User | null;
    busy: boolean;
    error: string;
    onCancel: () => void;
    onSave: (values: UserValues) => Promise<void>;
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
                    <div className="edit-form-head"><div className="edit-person"><strong>{user.firstName} {user.lastName}</strong><span>{user.email}</span></div></div>
                    <div className="form-grid">
                        <label className="field"><span>First name</span><input name="firstName" defaultValue={user.firstName} required maxLength={80} autoComplete="given-name" /></label>
                        <label className="field"><span>Last name</span><input name="lastName" defaultValue={user.lastName} required maxLength={80} autoComplete="family-name" /></label>
                        <label className="field field-full"><span>Email address</span><input name="email" type="email" defaultValue={user.email} required maxLength={254} autoComplete="email" /></label>
                        <fieldset className="status-field field-full">
                            <legend>Account status</legend>
                            <div className="status-options">
                                {(['Active', 'Inactive'] as const).map((status) => (
                                    <label key={status}>
                                        <input type="radio" name="status" value={status} defaultChecked={user.status === status} />
                                        <span className="radio-dot" />
                                        <span><strong>{status}</strong></span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                    </div>
                    {(localError || error) && <div className="form-error" role="alert">{localError || error}</div>}
                    <div className="form-actions">
                        <button type="button" className="button button-secondary" onClick={onCancel}><ArrowLeft size={16} /> Cancel</button>
                        <button type="submit" className="button button-primary" disabled={busy}><Check size={16} /> {busy ? 'Saving...' : 'Save changes'}</button>
                    </div>
                </form>
            ) : <EmptyState message={error || 'This person could not be found.'} />}
        </>
    );
}