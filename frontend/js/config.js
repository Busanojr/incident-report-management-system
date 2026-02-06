const CONFIG = {
    API_BASE_URL: 'http://localhost:3000/api',
    MAP_DEFAULT_CENTER: [8.3833, 124.8333],
    MAP_DEFAULT_ZOOM: 12,
    STATUS_COLORS: {
        'Pending': '#fbbf24',
        'Verified': '#3b82f6',
        'In Progress': '#6366f1',
        'Resolved': '#10b981',
        'False Report': '#ef4444'
    },
    PRIORITY_COLORS: {
        'Low': '#94a3b8',
        'Medium': '#fbbf24',
        'High': '#fb923c',
        'Critical': '#ef4444'
    },
    STORAGE_KEYS: {
        TOKEN: 'incident_token',
        USER: 'incident_user',
        IS_ADMIN: 'incident_is_admin'
    }
};
