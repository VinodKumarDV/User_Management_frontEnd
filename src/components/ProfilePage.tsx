import { Pencil } from 'lucide-react';
import { Detail, EmptyState, LoadingState, PageHeading, StatusBadge, type User } from './shared';

export function ProfilePage({ user, busy, onEdit }: { user: User | null; busy: boolean; onEdit: () => void }) {
    return (
        <>
            <PageHeading eyebrow="ACCOUNT" title="My profile" />
            {busy && !user ? <LoadingState /> : user ? (
                <section className="profile-layout">
                    <div className="profile-summary">
                        <div className="profile-avatar" aria-hidden="true">{user.firstName.charAt(0)}{user.lastName.charAt(0)}</div>
                        <div className="profile-summary-copy">
                            <div className="profile-name-row"><h2>{user.firstName} {user.lastName}</h2><StatusBadge status={user.status} /></div>
                            <p>{user.email}</p>
                        </div>
                    </div>
                    <div className="detail-section">
                        <div className="section-heading">
                            <h3>Personal information</h3>
                            <button className="button button-secondary" onClick={onEdit}><Pencil size={15} /> Edit profile</button>
                        </div>
                        <div className="detail-grid">
                            <Detail label="First name" value={user.firstName} />
                            <Detail label="Last name" value={user.lastName} />
                            <Detail label="Email address" value={user.email} />
                            <div className="detail-item"><span className="detail-label">Account status</span><StatusBadge status={user.status} /></div>
                        </div>
                    </div>
                </section>
            ) : <EmptyState message="Your profile could not be loaded." />}
        </>
    );
}