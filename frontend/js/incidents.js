
let submitMap = null;
let selectedLocation = null;

document.addEventListener('DOMContentLoaded', () => {
   
    const getCurrentLocationBtn = document.getElementById('getCurrentLocation');
    const locationDisplay = document.getElementById('locationDisplay');
    const locationText = document.getElementById('locationText');
    
    getCurrentLocationBtn?.addEventListener('click', async () => {
        try {
            getCurrentLocationBtn.disabled = true;
            getCurrentLocationBtn.innerHTML = '<span>Getting location...</span>';
            
            if (!navigator.geolocation) {
                throw new Error('Geolocation not supported by your browser');
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    selectedLocation = { lat, lng };
                    
                    document.getElementById('latitude').value = lat;
                    document.getElementById('longitude').value = lng;
                    
                    locationText.textContent = `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                    locationDisplay.classList.add('active');
                    
                    if (!submitMap) {
                        submitMap = new IncidentMap('submitMap', {
                            center: [lat, lng],
                            zoom: 15
                        }).init();
                        
                        submitMap.onClick((e) => {
                            const clickedLat = e.latlng.lat;
                            const clickedLng = e.latlng.lng;
                            
                            selectedLocation = { lat: clickedLat, lng: clickedLng };
                            
                            document.getElementById('latitude').value = clickedLat;
                            document.getElementById('longitude').value = clickedLng;
                            
                            locationText.textContent = `Location: ${clickedLat.toFixed(6)}, ${clickedLng.toFixed(6)}`;
                            
                            submitMap.addTemporaryMarker(clickedLat, clickedLng);
                        });
                    }
                    
                    submitMap.addTemporaryMarker(lat, lng);
                    
                    getCurrentLocationBtn.disabled = false;
                    getCurrentLocationBtn.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="2"/>
                            <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        Use Current Location
                    `;
                    
                    showNotification('Location obtained successfully', 'success');
                },
                (error) => {
                    getCurrentLocationBtn.disabled = false;
                    getCurrentLocationBtn.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="2"/>
                            <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        Use Current Location
                    `;
                    
                    let errorMessage = 'Failed to get location';
                    if (error.code === 1) {
                        errorMessage = 'Location access denied. Please enable location permissions.';
                    } else if (error.code === 2) {
                        errorMessage = 'Location unavailable. Please try again.';
                    } else if (error.code === 3) {
                        errorMessage = 'Location request timeout. Please try again.';
                    }
                    
                    showNotification(errorMessage, 'error');
                }
            );
        } catch (error) {
            getCurrentLocationBtn.disabled = false;
            showNotification(error.message, 'error');
        }
    });
    
    const submitForm = document.getElementById('submitForm');
    submitForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('incidentTitle').value;
        const description = document.getElementById('incidentDescription').value;
        const category = document.getElementById('incidentCategory').value;
        const priority = document.getElementById('incidentPriority').value;
        const latitude = document.getElementById('latitude').value;
        const longitude = document.getElementById('longitude').value;
        
        if (!latitude || !longitude) {
            showNotification('Please select a location first', 'error');
            return;
        }
        
        try {
            const incidentData = {
                title,
                description,
                category,
                priority,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                locationAddress: null 
            };
            
            await API.createIncident(incidentData);
            
            showNotification('Incident reported successfully!', 'success');
            
            submitForm.reset();
            locationDisplay.classList.remove('active');
            locationText.textContent = 'Click to get your location';
            selectedLocation = null;
            
            if (submitMap) {
                submitMap.clearMarkers();
            }
            
            window.location.hash = '#home';
            if (window.loadCurrentSection) {
                window.loadCurrentSection();
            }
        } catch (error) {
            showNotification(error.message || 'Failed to submit incident', 'error');
        }
    });
});


async function loadIncidentsTable() {
    try {
        const response = await API.getIncidents({ limit: 50 });
        const tbody = document.getElementById('reportsTableBody');
        
        if (!tbody) return;
        
        if (!response.incidents || response.incidents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No incidents reported yet</td></tr>';
            return;
        }
        
        tbody.innerHTML = response.incidents.map(incident => `
            <tr>
                <td>${incident.id}</td>
                <td>${incident.title}</td>
                <td>${incident.category || 'N/A'}</td>
                <td><span class="status-badge status-${incident.status.toLowerCase().replace(' ', '-')}">${incident.status}</span></td>
                <td><span class="priority-badge priority-${incident.priority.toLowerCase()}">${incident.priority}</span></td>
                <td>${new Date(incident.reported_at).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="viewIncidentDetails(${incident.id})">View</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading incidents table:', error);
        showNotification('Failed to load incidents', 'error');
    }
}

window.loadIncidentsTable = loadIncidentsTable;