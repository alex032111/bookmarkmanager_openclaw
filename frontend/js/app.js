// OpenClaw Application
const App = {
    currentView: 'bookmarks',
    
    // Initialize application
    async init() {
        console.log('Initializing OpenClaw...');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load initial data
        await this.loadInitialData();
        
        console.log('OpenClaw initialized');
    },
    
    // Setup all event listeners
    setupEventListeners() {
        // Add bookmark button
        document.getElementById('add-bookmark-btn').addEventListener('click', () => {
            this.populateFolderSelect();
            UI.openBookmarkModal();
        });
        
        // Add folder button
        document.getElementById('add-folder-btn').addEventListener('click', () => {
            this.populateParentFolderSelect();
            UI.openFolderModal();
        });
        
        // Refresh button
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.loadInitialData();
        });
        
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            Storage.toggleTheme();
        });
        
        // Sidebar toggle (mobile)
        document.getElementById('sidebar-toggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });
        
        // Favorites filter
        document.getElementById('favorites-filter-btn').addEventListener('click', (e) => {
            e.currentTarget.classList.toggle('active');
            Storage.setFavoritesFilter(e.currentTarget.classList.contains('active'));
            this.loadBookmarks();
        });
        
        // Search input
        document.getElementById('search-input').addEventListener('input', (e) => {
            const debounceTimer = this.searchDebounceTimer;
            clearTimeout(debounceTimer);
            this.searchDebounceTimer = setTimeout(() => {
                Storage.setSearchQuery(e.target.value);
                this.loadBookmarks();
            }, 300);
        });
        
        // Bookmark form submit
        document.getElementById('bookmark-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBookmark();
        });
        
        // Folder form submit
        document.getElementById('folder-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveFolder();
        });
        
        // Close modals
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', UI.closeModals);
        });
        
        // Close modals on backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    UI.closeModals();
                }
            });
        });
        
        // Mobile navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                this.switchView(item.dataset.view);
            });
        });
    },
    
    // Load initial data
    async loadInitialData() {
        UI.showLoading(true);
        
        try {
            await Promise.all([
                this.loadBookmarks(),
                this.loadFolders(),
                this.loadTags()
            ]);
            
            // Restore favorites filter state
            const favoritesEnabled = Storage.getFavoritesFilter();
            if (favoritesEnabled) {
                document.getElementById('favorites-filter-btn').classList.add('active');
            }
            
            // Restore search query
            const searchQuery = Storage.getSearchQuery();
            document.getElementById('search-input').value = searchQuery;
            
            // Restore current folder/tag selection
            const currentFolder = Storage.getCurrentFolder();
            const currentTag = Storage.getCurrentTag();
            
            if (currentTag) {
                this.updateBreadcrumbs(`Tag: ${currentTag}`);
            } else if (currentFolder) {
                // Folder name will be updated when folders load
                this.updateBreadcrumbs('Loading...');
            }
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            UI.showToast('Fout bij laden van gegevens', 'error');
        }
        
        UI.showLoading(false);
    },
    
    // Load bookmarks
    async loadBookmarks() {
        try {
            const params = {};
            
            const folderId = Storage.getCurrentFolder();
            const tagName = Storage.getCurrentTag();
            const searchQuery = Storage.getSearchQuery();
            const favoritesOnly = Storage.getFavoritesFilter();
            
            if (folderId) params.folder_id = folderId;
            if (tagName) params.tag = tagName;
            if (searchQuery) params.search = searchQuery;
            if (favoritesOnly) params.favorites = true;
            
            const bookmarks = await API.getBookmarks(params);
            UI.renderBookmarks(bookmarks);
        } catch (error) {
            console.error('Error loading bookmarks:', error);
            UI.showToast('Fout bij laden van bookmarks', 'error');
        }
    },
    
    // Load folders
    async loadFolders() {
        try {
            const folders = await API.getFolders();
            UI.renderFolders(folders);
            
            // Update breadcrumbs if folder is selected
            const currentFolder = Storage.getCurrentFolder();
            if (currentFolder) {
                const folder = folders.find(f => f.id === parseInt(currentFolder));
                if (folder) {
                    this.updateBreadcrumbs(`Folder: ${folder.name}`);
                }
            }
        } catch (error) {
            console.error('Error loading folders:', error);
        }
    },
    
    // Load tags
    async loadTags() {
        try {
            const tags = await API.getPopularTags(20);
            UI.renderTags(tags);
        } catch (error) {
            console.error('Error loading tags:', error);
        }
    },
    
    // Populate folder select dropdown
    async populateFolderSelect() {
        const select = document.getElementById('bookmark-folder');
        select.innerHTML = '<option value="">Geen folder</option>';
        
        try {
            const folders = await API.getFolders();
            folders.forEach(folder => {
                const option = document.createElement('option');
                option.value = folder.id;
                option.textContent = folder.name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading folders:', error);
        }
    },
    
    // Populate parent folder select dropdown
    async populateParentFolderSelect() {
        const select = document.getElementById('folder-parent');
        select.innerHTML = '<option value="">Geen parent</option>';
        
        try {
            const folders = await API.getFolders();
            folders.forEach(folder => {
                const option = document.createElement('option');
                option.value = folder.id;
                option.textContent = folder.name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading folders:', error);
        }
    },
    
    // Save bookmark (create or update)
    async saveBookmark() {
        UI.showLoading(true);
        
        try {
            const id = document.getElementById('bookmark-id').value;
            const data = {
                title: document.getElementById('bookmark-title').value,
                url: document.getElementById('bookmark-url').value,
                description: document.getElementById('bookmark-description').value,
                folder_id: document.getElementById('bookmark-folder').value || null,
                tags: document.getElementById('bookmark-tags').value
                    .split(',')
                    .map(t => t.trim())
                    .filter(t => t),
                is_favorite: document.getElementById('bookmark-favorite').checked
            };
            
            if (id) {
                await API.updateBookmark(id, data);
                UI.showToast('Bookmark bijgewerkt', 'success');
            } else {
                await API.createBookmark(data);
                UI.showToast('Bookmark aangemaakt', 'success');
            }
            
            UI.closeModals();
            await this.loadBookmarks();
            await this.loadFolders(); // Update counts
            
        } catch (error) {
            console.error('Error saving bookmark:', error);
            UI.showToast('Fout bij opslaan bookmark', 'error');
        }
        
        UI.showLoading(false);
    },
    
    // Save folder
    async saveFolder() {
        UI.showLoading(true);
        
        try {
            const data = {
                name: document.getElementById('folder-name').value,
                parent_id: document.getElementById('folder-parent').value || null,
                description: document.getElementById('folder-description').value
            };
            
            await API.createFolder(data);
            UI.showToast('Folder aangemaakt', 'success');
            
            UI.closeModals();
            await this.loadFolders();
            await this.populateFolderSelect();
            
        } catch (error) {
            console.error('Error saving folder:', error);
            UI.showToast('Fout bij aanmaken folder', 'error');
        }
        
        UI.showLoading(false);
    },
    
    // Edit bookmark
    async editBookmark(id, event) {
        event.stopPropagation();
        
        try {
            const bookmark = await API.getBookmark(id);
            await this.populateFolderSelect();
            UI.openBookmarkModal(bookmark);
        } catch (error) {
            console.error('Error loading bookmark:', error);
            UI.showToast('Fout bij laden bookmark', 'error');
        }
    },
    
    // Delete bookmark
    deleteBookmark(id, event) {
        event.stopPropagation();
        
        UI.showDeleteConfirm('Weet je zeker dat je deze bookmark wilt verwijderen?', async () => {
            UI.showLoading(true);
            
            try {
                await API.deleteBookmark(id);
                UI.showToast('Bookmark verwijderd', 'success');
                await this.loadBookmarks();
                await this.loadFolders(); // Update counts
            } catch (error) {
                console.error('Error deleting bookmark:', error);
                UI.showToast('Fout bij verwijderen bookmark', 'error');
            }
            
            UI.showLoading(false);
        });
    },
    
    // Select folder
    selectFolder(id, name) {
        const currentFolder = Storage.getCurrentFolder();
        
        if (currentFolder === String(id)) {
            // Deselect
            Storage.setCurrentFolder(null);
            this.updateBreadcrumbs('Alle Bookmarks');
        } else {
            Storage.setCurrentFolder(id);
            Storage.setCurrentTag(null); // Clear tag selection
            this.updateBreadcrumbs(`Folder: ${name}`);
        }
        
        this.loadBookmarks();
        this.loadFolders(); // Refresh to update active state
    },
    
    // Select tag
    selectTag(name) {
        const currentTag = Storage.getCurrentTag();
        
        if (currentTag === name) {
            // Deselect
            Storage.setCurrentTag(null);
            this.updateBreadcrumbs('Alle Bookmarks');
        } else {
            Storage.setCurrentTag(name);
            Storage.setCurrentFolder(null); // Clear folder selection
            this.updateBreadcrumbs(`Tag: ${name}`);
        }
        
        this.loadBookmarks();
        this.loadTags(); // Refresh to update active state
    },
    
    // Show folder context menu
    showFolderContext(event, id, name) {
        event.preventDefault();
        event.stopPropagation();
        
        // Simple implementation - just show delete option
        const confirmDelete = confirm(`Folder "${name}" verwijderen?\n\nAlle bookmarks in deze folder worden ook verwijderd.`);
        if (confirmDelete) {
            this.deleteFolder(id);
        }
    },
    
    // Delete folder
    async deleteFolder(id) {
        UI.showLoading(true);
        
        try {
            await API.deleteFolder(id);
            UI.showToast('Folder verwijderd', 'success');
            
            // Clear selection if this folder was selected
            if (Storage.getCurrentFolder() === String(id)) {
                Storage.setCurrentFolder(null);
                this.updateBreadcrumbs('Alle Bookmarks');
            }
            
            await this.loadFolders();
            await this.loadBookmarks();
            
        } catch (error) {
            console.error('Error deleting folder:', error);
            UI.showToast('Fout bij verwijderen folder', 'error');
        }
        
        UI.showLoading(false);
    },
    
    // Switch view (mobile navigation)
    switchView(view) {
        this.currentView = view;
        
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === view);
        });
        
        // Reset filters based on view
        if (view === 'bookmarks') {
            Storage.setCurrentFolder(null);
            Storage.setCurrentTag(null);
            Storage.setFavoritesFilter(false);
            document.getElementById('favorites-filter-btn').classList.remove('active');
            document.getElementById('search-input').value = '';
            Storage.setSearchQuery('');
            this.updateBreadcrumbs('Alle Bookmarks');
        } else if (view === 'folders') {
            // Toggle sidebar on mobile to show folders
            document.getElementById('sidebar').classList.remove('collapsed');
        } else if (view === 'tags') {
            // Toggle sidebar on mobile to show tags
            document.getElementById('sidebar').classList.remove('collapsed');
        } else if (view === 'favorites') {
            Storage.setCurrentFolder(null);
            Storage.setCurrentTag(null);
            Storage.setFavoritesFilter(true);
            document.getElementById('favorites-filter-btn').classList.add('active');
            this.updateBreadcrumbs('Favorieten');
        }
        
        this.loadBookmarks();
    },
    
    // Update breadcrumbs
    updateBreadcrumbs(text) {
        UI.updateBreadcrumbs(text);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});