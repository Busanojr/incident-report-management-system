
async function loadAdminStats() {
    if (!Auth.isAdmin()) return;
    
    try {
        const response = await API.getAdminStats();
        const stats = response.stats;
        
        document.getElementById('totalReports').textContent = stats.totalReports || 0;
        document.getElementById('flaggedUsers').textContent = stats.flaggedUsers || 0;
        
        let pending = 0;
        let resolved = 0;
        
        if (stats.statusBreakdown) {
            stats.statusBreakdown.forEach(item => {
                if (item.status === 'Pending') pending = item.count;
                if (item.status === 'Resolved') resolved = item.count;
            });
        }
        
        document.getElementById('pendingReports').textContent = pending;
        document.getElementById('resolvedReports').textContent = resolved;
    } catch (error) {
        console.error('Error loading admin stats:', error);
    }
}


async function loadAdminTable() {
    if (!Auth.isAdmin()) return;
    
    try {
        const response = await API.getIncidents({ limit: 100 });
        const tbody = document.getElementById('adminTableBody');
        
        if (!tbody) return;
        
        if (!response.incidents || response.incidents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No incidents to manage</td></tr>';
            return;
        }
        
        tbody.innerHTML = response.incidents.map(incident => `
            <tr>
                <td>${incident.id}</td>
                <td>
                    ${incident.title}
                    ${incident.user_flagged ? '<br><small style="color: #ef4444;">⚠ Flagged User</small>' : ''}
                </td>
                <td>${incident.username || 'Anonymous'}</td>
                <td>
                    <select class="status-select" data-id="${incident.id}" data-current="${incident.status}">
                        <option value="Pending" ${incident.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Verified" ${incident.status === 'Verified' ? 'selected' : ''}>Verified</option>
                        <option value="In Progress" ${incident.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Resolved" ${incident.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                        <option value="False Report" ${incident.status === 'False Report' ? 'selected' : ''}>False Report</option>
                    </select>
                </td>
                <td>
                    <select class="priority-select" data-id="${incident.id}" data-current="${incident.priority}">
                        <option value="Low" ${incident.priority === 'Low' ? 'selected' : ''}>Low</option>
                        <option value="Medium" ${incident.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                        <option value="High" ${incident.priority === 'High' ? 'selected' : ''}>High</option>
                        <option value="Critical" ${incident.priority === 'Critical' ? 'selected' : ''}>Critical</option>
                    </select>
                </td>
                <td>${new Date(incident.reported_at).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="viewIncidentDetails(${incident.id})">View</button>
                        <button class="btn-action btn-edit" onclick="editIncidentNotes(${incident.id})">Notes</button>
                        <button class="btn-action btn-delete" onclick="deleteIncident(${incident.id})">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        tbody.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const incidentId = e.target.dataset.id;
                const newStatus = e.target.value;
                const oldStatus = e.target.dataset.current;
                
                if (newStatus === oldStatus) return;
                
                try {
                    await API.updateIncident(incidentId, { status: newStatus });
                    showNotification('Status updated successfully', 'success');
                    e.target.dataset.current = newStatus;
                    
                    loadAdminStats();
                    if (window.mainMap) {
                        window.mainMap.loadIncidents();
                    }
                } catch (error) {
                    showNotification('Failed to update status', 'error');
                    e.target.value = oldStatus; 
                }
            });
        });
        
        tbody.querySelectorAll('.priority-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const incidentId = e.target.dataset.id;
                const newPriority = e.target.value;
                const oldPriority = e.target.dataset.current;
                
                if (newPriority === oldPriority) return;
                
                try {
                    await API.updateIncident(incidentId, { priority: newPriority });
                    showNotification('Priority updated successfully', 'success');
                    e.target.dataset.current = newPriority;
                    
                    
                    if (window.mainMap) {
                        window.mainMap.loadIncidents();
                    }
                } catch (error) {
                    showNotification('Failed to update priority', 'error');
                    e.target.value = oldPriority; 
                }
            });
        });
    } catch (error) {
        console.error('Error loading admin table:', error);
        showNotification('Failed to load incidents', 'error');
    }
}


window.editIncidentNotes = async function(incidentId) {
    try {
        const response = await API.getIncident(incidentId);
        const incident = response.incident;
        
        const notes = prompt('Enter admin notes for this incident:', incident.admin_notes || '');
        
        if (notes !== null) {
            await API.updateIncident(incidentId, { adminNotes: notes });
            showNotification('Notes updated successfully', 'success');
            loadAdminTable();
        }
    } catch (error) {
        showNotification('Failed to update notes', 'error');
    }
};


window.deleteIncident = async function(incidentId) {
    if (!confirm('Are you sure you want to delete this incident? This action cannot be undone.')) {
        return;
    }
    
    try {
        await API.deleteIncident(incidentId);
        showNotification('Incident deleted successfully', 'success');
        loadAdminTable();
        loadAdminStats();
        
        if (window.mainMap) {
            window.mainMap.loadIncidents();
        }
    } catch (error) {
        showNotification('Failed to delete incident', 'error');
    }
};

const adminStyle = document.createElement('style');
adminStyle.textContent = `
    .status-select,
    .priority-select {
        padding: 4px 8px;
        border: 1px solid var(--border);
        border-radius: 4px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        font-size: 0.9rem;
        cursor: pointer;
        font-family: var(--font-mono);
    }
    
    .status-select:focus,
    .priority-select:focus {
        outline: none;
        border-color: var(--primary);
    }
`;
document.head.appendChild(adminStyle);

window.loadAdminStats = loadAdminStats;
window.loadAdminTable = loadAdminTable;