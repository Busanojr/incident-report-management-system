
class IncidentMap {
    constructor(elementId, options = {}) {
        this.elementId = elementId;
        this.map = null;
        this.markers = [];
        this.options = {
            center: options.center || CONFIG.MAP_DEFAULT_CENTER,
            zoom: options.zoom || CONFIG.MAP_DEFAULT_ZOOM,
            ...options
        };
    }
    
   
    init() {
      
        this.map = L.map(this.elementId).setView(this.options.center, this.options.zoom);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);
        
        return this;
    }
    
    
    clearMarkers() {
        this.markers.forEach(marker => marker.remove());
        this.markers = [];
    }
    
  
    getMarkerColor(status) {
        return CONFIG.STATUS_COLORS[status] || '#94a3b8';
    }
    
    
    createMarkerIcon(status, priority) {
        const color = this.getMarkerColor(status);
        const size = priority === 'Critical' ? 40 : priority === 'High' ? 35 : 30;
        
        return L.divIcon({
            className: 'custom-marker',
            html: `
                <div style="
                    width: ${size}px;
                    height: ${size}px;
                    background: ${color};
                    border: 3px solid #fff;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    color: #fff;
                    font-size: 14px;
                ">
                    !
                </div>
            `,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2]
        });
    }
    
    
    async loadIncidents(filters = {}) {
        try {
            const response = await API.getIncidents(filters);
            this.clearMarkers();
            
            if (!response.incidents || response.incidents.length === 0) {
                showNotification('No incidents found', 'info');
                return;
            }
            
            response.incidents.forEach(incident => {
                this.addIncidentMarker(incident);
            });
            
            if (this.markers.length > 0) {
                const group = L.featureGroup(this.markers);
                this.map.fitBounds(group.getBounds().pad(0.1));
            }
        } catch (error) {
            console.error('Error loading incidents:', error);
            showNotification('Failed to load incidents', 'error');
        }
    }
    
   
    addIncidentMarker(incident) {
        const icon = this.createMarkerIcon(incident.status, incident.priority);
        
        const marker = L.marker([incident.latitude, incident.longitude], { icon })
            .addTo(this.map);
        
        const popupContent = `
            <div class="popup-content">
                <h4>${incident.title}</h4>
                <p><strong>Status:</strong> <span class="status-badge status-${incident.status.toLowerCase().replace(' ', '-')}">${incident.status}</span></p>
                <p><strong>Priority:</strong> <span class="priority-badge priority-${incident.priority.toLowerCase()}">${incident.priority}</span></p>
                <p><strong>Category:</strong> ${incident.category || 'N/A'}</p>
                <p><strong>Reported:</strong> ${new Date(incident.reported_at).toLocaleDateString()}</p>
                <button onclick="viewIncidentDetails(${incident.id})" class="btn-primary" style="margin-top: 8px; width: 100%;">
                    View Details
                </button>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        this.markers.push(marker);
    }
    
    
    onClick(callback) {
        this.map.on('click', callback);
    }
    
    
    addTemporaryMarker(lat, lng) {
        this.clearMarkers();
        
        const marker = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'custom-marker',
                html: `
                    <div style="
                        width: 30px;
                        height: 30px;
                        background: #3b82f6;
                        border: 3px solid #fff;
                        border-radius: 50%;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                    "></div>
                `,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            })
        }).addTo(this.map);
        
        this.markers.push(marker);
        this.map.setView([lat, lng], 15);
    }
    
    getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                position => {
                    const coords = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    resolve(coords);
                },
                error => reject(error)
            );
        });
    }
}

window.viewIncidentDetails = async function(incidentId) {
    try {
        const response = await API.getIncident(incidentId);
        const incident = response.incident;
        const actions = response.adminActions || [];
        
        const modal = document.getElementById('incidentModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        
        modalTitle.textContent = incident.title;
        
        let actionsHtml = '';
        if (actions.length > 0) {
            actionsHtml = `
                <div class="detail-row">
                    <div class="detail-label">Admin Actions</div>
                    <div class="detail-value">
                        ${actions.map(action => `
                            <div style="margin-bottom: 8px; padding: 8px; background: rgba(59, 130, 246, 0.1); border-radius: 4px;">
                                <strong>${action.action_type}</strong> by ${action.admin_username || 'Admin'}
                                ${action.old_value ? `<br>Changed from: ${action.old_value} → ${action.new_value}` : ''}
                                ${action.notes ? `<br>Note: ${action.notes}` : ''}
                                <br><small>${new Date(action.action_timestamp).toLocaleString()}</small>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        modalBody.innerHTML = `
            <div class="incident-detail">
                <div class="detail-row">
                    <div class="detail-label">Description</div>
                    <div class="detail-value">${incident.description}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Status</div>
                    <div class="detail-value">
                        <span class="status-badge status-${incident.status.toLowerCase().replace(' ', '-')}">${incident.status}</span>
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Priority</div>
                    <div class="detail-value">
                        <span class="priority-badge priority-${incident.priority.toLowerCase()}">${incident.priority}</span>
                    </div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Category</div>
                    <div class="detail-value">${incident.category || 'N/A'}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Location</div>
                    <div class="detail-value">${incident.location_address || `${incident.latitude}, ${incident.longitude}`}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Reported By</div>
                    <div class="detail-value">${incident.username || 'Anonymous'} ${incident.user_flagged ? '<span style="color: #ef4444;">(Flagged User)</span>' : ''}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Reported At</div>
                    <div class="detail-value">${new Date(incident.reported_at).toLocaleString()}</div>
                </div>
                ${incident.admin_notes ? `
                    <div class="detail-row">
                        <div class="detail-label">Admin Notes</div>
                        <div class="detail-value">${incident.admin_notes}</div>
                    </div>
                ` : ''}
                ${actionsHtml}
            </div>
        `;
        
        modal.classList.remove('hidden');
    } catch (error) {
        showNotification('Failed to load incident details', 'error');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('incidentModal');
    const closeBtn = document.getElementById('closeModal');
    
    closeBtn?.addEventListener('click', () => {
        modal.classList.add('hidden');
    });
    
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
});