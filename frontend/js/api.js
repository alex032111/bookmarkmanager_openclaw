// API client for OpenClaw Backend
const API = {
    baseUrl: null,
    
    init() {
        this.baseUrl = Storage.getApiUrl();
    },
    
    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        };
        
        try {
            const response = await fetch(url, mergedOptions);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    // GET request
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url);
    },
    
    // POST request
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    
    // PUT request
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
    
    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE',
        });
    },
    
    // Bookmarks
    async getBookmarks(params = {}) {
        return this.get('/api/bookmarks', params);
    },
    
    async getBookmark(id) {
        return this.get(`/api/bookmarks/${id}`);
    },
    
    async createBookmark(data) {
        return this.post('/api/bookmarks', data);
    },
    
    async updateBookmark(id, data) {
        return this.put(`/api/bookmarks/${id}`, data);
    },
    
    async deleteBookmark(id) {
        return this.delete(`/api/bookmarks/${id}`);
    },
    
    async visitBookmark(id) {
        return this.post(`/api/bookmarks/${id}/visit`);
    },
    
    // Folders
    async getFolders() {
        return this.get('/api/folders');
    },
    
    async getFolderTree() {
        return this.get('/api/folders/tree');
    },
    
    async getFolder(id) {
        return this.get(`/api/folders/${id}`);
    },
    
    async createFolder(data) {
        return this.post('/api/folders', data);
    },
    
    async updateFolder(id, data) {
        return this.put(`/api/folders/${id}`, data);
    },
    
    async deleteFolder(id) {
        return this.delete(`/api/folders/${id}`);
    },
    
    // Tags
    async getTags() {
        return this.get('/api/tags');
    },
    
    async getPopularTags(limit = 10) {
        return this.get('/api/tags/popular', { limit });
    },
    
    async getTag(id) {
        return this.get(`/api/tags/${id}`);
    },
    
    async createTag(data) {
        return this.post('/api/tags', data);
    },
    
    async updateTag(id, data) {
        return this.put(`/api/tags/${id}`, data);
    },
    
    async deleteTag(id) {
        return this.delete(`/api/tags/${id}`);
    },
    
    // Health check
    async healthCheck() {
        return this.get('/health');
    },
    
    // Get favicon for URL
    getFaviconUrl(url) {
        try {
            const domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        } catch {
            return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23404040"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12h20"/></svg>';
        }
    }
};

// Initialize API
document.addEventListener('DOMContentLoaded', () => {
    API.init();
});