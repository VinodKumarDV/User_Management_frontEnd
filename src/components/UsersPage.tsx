import { ArrowLeft, ArrowRight, Pencil, Search } from 'lucide-react';
import { EmptyState, LoadingState, StatusBadge, type Pagination, type User } from './shared';

export function UsersPage({ users, filter, onFilter, statusFilter, onStatusFilter, pagination, onPageChange, onEdit, busy }: {
    users: User[];
    filter: string;
    onFilter: (value: string) => void;
    statusFilter: 'all' | User['status'];
    onStatusFilter: (value: 'all' | User['status']) => void;
    pagination: Pagination;
    onPageChange: (page: number) => void;
    onEdit: (id: string) => void;
    busy: boolean;
}) {
    return (
        <>
            <div className="page-heading"><h1>User directory</h1></div>
            <div className="directory-meta">
                <label className="search-field">
                    <Search size={17} />
                    <input value={filter} onChange={(event) => onFilter(event.target.value)} placeholder="Search users" aria-label="Search users" />
                </label>
                <label className="status-filter">Status
                    <select value={statusFilter} onChange={(event) => onStatusFilter(event.target.value as 'all' | User['status'])} aria-label="Filter by status">
                        <option value="all">All statuses</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </label>
            </div>
            <section className="table-wrap" aria-label="Users">
                <table>
                    <thead><tr><th>ID</th><th>PERSON</th><th>EMAIL</th><th>STATUS</th><th className="action-column">ACTION</th></tr></thead>
                    <tbody>
                        {busy ? <tr><td colSpan={5}><LoadingState /></td></tr> : users.length ? users.map((user) => (
                            <tr key={user.id}>
                                <td className="id-cell">{user.id}</td>
                                <td><strong>{user.firstName} {user.lastName}</strong></td>
                                <td className="email-cell">{user.email}</td>
                                <td><StatusBadge status={user.status} /></td>
                                <td className="action-column"><button className="icon-button edit-action" onClick={() => onEdit(user.id)} aria-label={`Edit ${user.firstName} ${user.lastName}`} title="Edit person"><Pencil size={16} /></button></td>
                            </tr>
                        )) : <tr><td colSpan={5}><EmptyState message={filter || statusFilter !== 'all' ? 'No users match these filters.' : 'No users have been added yet.'} /></td></tr>}
                    </tbody>
                </table>
            </section>
            <div className="directory-footer">
                <span aria-live="polite">{pagination.total === 0 ? 'No results' : `Showing ${(pagination.page - 1) * pagination.pageSize + 1}-${Math.min(pagination.page * pagination.pageSize, pagination.total)} of ${pagination.total} users`}</span>
                <div className="pagination-controls">
                    <button className="icon-button" onClick={() => onPageChange(pagination.page - 1)} disabled={busy || pagination.page <= 1} aria-label="Previous page"><ArrowLeft size={16} /></button>
                    <span>Page {pagination.page} of {Math.max(pagination.totalPages, 1)}</span>
                    <button className="icon-button" onClick={() => onPageChange(pagination.page + 1)} disabled={busy || pagination.page >= pagination.totalPages} aria-label="Next page"><ArrowRight size={16} /></button>
                </div>
            </div>
        </>
    );
}