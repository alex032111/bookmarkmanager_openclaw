// LocalStorage wrapper for OpenClaw
const Storage = {
    // Get API base URL
    getApiUrl() {
        // Try to auto-detect, fallback to localhost
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = window.location.port === '3001' ? ':3000' : (window.location.port ? `:${window.location.port}` : '');
        
        return localStorage.getItem('openclaw_api_url') || `${protocol}//${hostname}${port}`;
    },
    
    setApiUrl(url) {
        localStorage.setItem('openclaw_api_url', url);
    },
    
    // Theme preferences
    getTheme() {
        return localStorage.getItem('openclaw_theme') || 'dark';
    },
    
    setTheme(theme) {
        localStorage.setItem('openclaw_theme', theme);
        this.applyTheme(theme);
    },
    
    applyTheme(theme) {
        if (theme === 'light') {
            document.body.classList.add('light-mode');
            document.getElementById('moon-icon').style.display = 'none';
            document.getElementById('sun-icon').style.display = 'block';
        } else {
            document.body.classList.remove('light-mode');
            document.getElementById('moon-icon').style.display = 'block';
            document.getElementById('sun-icon').style.display = 'none';
        }
    },
    
    toggleTheme() {
        const current = this.getTheme();
        const newTheme = current === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        return newTheme;
    },
    
    // Current view (for mobile nav)
    getCurrentView() {
        return localStorage.getItem('openclaw_current_view') || 'bookmarks';
    },
    
    setCurrentView(view) {
        localStorage.setItem('openclaw_current_view', view);
    },
    
    // Last selected folder
    getCurrentFolder() {
        return localStorage.getItem('openclaw_current_folder');
    },
    
    setCurrentFolder(folderId) {
        if (folderId) {
            localStorage.setItem('openclaw_current_folder', folderId);
        } else {
            localStorage.removeItem('openclaw_current_folder');
        }
    },
    
    // Last selected tag
    getCurrentTag() {
        return localStorage.getItem('openclaw_current_tag');
    },
    
    setCurrentTag(tagName) {
        if (tagName) {
            localStorage.setItem('openclaw_current_tag', tagName);
        } else {
            localStorage.removeItem('openclaw_current_tag');
        }
    },
    
    // Search query
    getSearchQuery() {
        return localStorage.getItem('openclaw_search_query') || '';
    },
    
    setSearchQuery(query) {
        localStorage.setItem('openclaw_search_query', query);
    },
    
    // Favorites filter
    getFavoritesFilter() {
        return localStorage.getItem('openclaw_favorites_filter') === 'true';
    },
    
    setFavoritesFilter(enabled) {
        localStorage.setItem('openclaw_favorites_filter', enabled);
    },
    
    // Initialize on load
    init() {
        // Apply saved theme
        this.applyTheme(this.getTheme());
        
        // Apply saved API URL if custom
        const customApiUrl = localStorage.getItem('openclaw_api_url');
        if (customApiUrl) {
            console.log('Using custom API URL:', customApiUrl);
        }
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    Storage.init();
});