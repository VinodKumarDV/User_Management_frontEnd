import { Mail, UsersRound } from 'lucide-react';

export type User = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: 'Active' | 'Inactive';
};

export type Pagination = { page: number; pageSize: number; total: number; totalPages: number };

export function Brand() {
    return <div className="brand-lockup"><span className="brand-icon"><UsersRound size={18} strokeWidth={2.2} /></span><span>User Management</span></div>;
}

export function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
    return <div className="page-heading"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>;
}

export function Detail({ label, value }: { label: string; value: string }) {
    return <div className="detail-item"><span className="detail-label">{label}</span><span className="detail-value">{value}</span></div>;
}

export function StatusBadge({ status }: { status: User['status'] }) {
    return <span className={`status-badge ${status.toLowerCase()}`}>{status}</span>;
}

export function LoadingState() {
    return <div className="loading-state"><span className="loading-dot" /> Loading…</div>;
}

export function EmptyState({ message }: { message: string }) {
    return <div className="empty-state"><Mail size={21} /><p>{message}</p></div>;
}