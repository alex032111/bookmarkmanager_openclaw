// UI rendering functions
const UI = {
    // Show/hide loading overlay
    showLoading(show = true) {
        const overlay = document.getElementById('loading-overlay');
        overlay.style.display = show ? 'flex' : 'none';
    },
    
    // Show alert toast
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            background-color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    
    // Render bookmarks list
    renderBookmarks(bookmarks) {
        const container = document.getElementById('bookmarks-container');
        const emptyState = document.getElementById('empty-state');
        
        if (bookmarks.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'flex';
            return;
        }
        
        emptyState.style.display = 'none';
        container.innerHTML = bookmarks.map(bookmark => this.createBookmarkCard(bookmark)).join('');
    },
    
    // Create bookmark card HTML
    createBookmarkCard(bookmark) {
        const faviconUrl = bookmark.favicon_url || API.getFaviconUrl(bookmark.url);
        const tagsHtml = (bookmark.tags || []).map(tag => 
            `<span class="bookmark-tag">${this.escapeHtml(tag)}</span>`
        ).join('');
        
        const lastVisited = bookmark.last_visited 
            ? new Date(bookmark.last_visited).toLocaleDateString('nl-NL')
            : 'Nooit';
        
        return `
            <div class="bookmark-card" data-id="${bookmark.id}">
                <div class="bookmark-header">
                    <img src="${faviconUrl}" alt="" class="bookmark-favicon" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%23404040%22><path d=%22M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12h20%22/></svg>'">
                    <div class="bookmark-info">
                        <h3 class="bookmark-title" title="${this.escapeHtml(bookmark.title)}">${this.escapeHtml(bookmark.title)}</h3>
                        <a href="${this.escapeHtml(bookmark.url)}" class="bookmark-url" target="_blank" rel="noopener" onclick="UI.visitBookmark(${bookmark.id}, event)">${this.escapeHtml(bookmark.url)}</a>
                    </div>
                </div>
                ${bookmark.description ? `<p class="bookmark-description" title="${this.escapeHtml(bookmark.description)}">${this.escapeHtml(bookmark.description)}</p>` : ''}
                ${tagsHtml ? `<div class="bookmark-tags">${tagsHtml}</div>` : ''}
                <div class="bookmark-actions">
                    <button class="bookmark-action-btn favorite ${bookmark.is_favorite ? 'active' : ''}" 
                            onclick="UI.toggleFavorite(${bookmark.id}, event)" 
                            title="${bookmark.is_favorite ? 'Verwijder uit favorieten' : 'Toevoegen aan favorieten'}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="${bookmark.is_favorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                    </button>
                    <button class="bookmark-action-btn edit" onclick="App.editBookmark(${bookmark.id}, event)" title="Bewerken">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="bookmark-action-btn delete" onclick="App.deleteBookmark(${bookmark.id}, event)" title="Verwijderen">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    },
    
    // Render folders list
    renderFolders(folders) {
        const container = document.getElementById('folders-list');
        if (folders.length === 0) {
            container.innerHTML = '<div class="empty-state-small">Geen folders</div>';
            return;
        }
        
        container.innerHTML = folders.map(folder => `
            <div class="folder-item ${folder.id === Storage.getCurrentFolder() ? 'active' : ''}" 
                 onclick="App.selectFolder(${folder.id}, '${this.escapeHtml(folder.name)}')"
                 oncontextmenu="App.showFolderContext(event, ${folder.id}, '${this.escapeHtml(folder.name)}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <span>${this.escapeHtml(folder.name)}</span>
                <span class="folder-count">${folder.bookmark_count || 0}</span>
            </div>
        `).join('');
    },
    
    // Render tags list
    renderTags(tags) {
        const container = document.getElementById('tags-list');
        if (tags.length === 0) {
            container.innerHTML = '<div class="empty-state-small">Geen tags</div>';
            return;
        }
        
        container.innerHTML = tags.map(tag => `
            <div class="tag-item ${tag.name === Storage.getCurrentTag() ? 'active' : ''}" 
                 onclick="App.selectTag('${this.escapeHtml(tag.name)}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                    <line x1="7" y1="7" x2="7.01" y2="7"/>
                </svg>
                <span>${this.escapeHtml(tag.name)}</span>
                <span class="tag-count">${tag.count}</span>
            </div>
        `).join('');
    },
    
    // Update bookmark modal
    openBookmarkModal(bookmark = null) {
        const modal = document.getElementById('bookmark-modal');
        const form = document.getElementById('bookmark-form');
        const title = document.getElementById('modal-title');
        
        form.reset();
        
        if (bookmark) {
            title.textContent = 'Bookmark Bewerken';
            document.getElementById('bookmark-id').value = bookmark.id;
            document.getElementById('bookmark-title').value = bookmark.title;
            document.getElementById('bookmark-url').value = bookmark.url;
            document.getElementById('bookmark-description').value = bookmark.description || '';
            document.getElementById('bookmark-folder').value = bookmark.folder_id || '';
            document.getElementById('bookmark-tags').value = (bookmark.tags || []).join(', ');
            document.getElementById('bookmark-favorite').checked = bookmark.is_favorite;
        } else {
            title.textContent = 'Nieuw Bookmark';
            document.getElementById('bookmark-id').value = '';
        }
        
        modal.style.display = 'flex';
    },
    
    // Update folder modal
    openFolderModal() {
        const modal = document.getElementById('folder-modal');
        const form = document.getElementById('folder-form');
        
        form.reset();
        modal.style.display = 'flex';
    },
    
    // Close all modals
    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    },
    
    // Show delete confirmation
    showDeleteConfirm(message, callback) {
        const modal = document.getElementById('delete-modal');
        const messageEl = document.getElementById('delete-message');
        const confirmBtn = document.getElementById('confirm-delete-btn');
        
        messageEl.textContent = message;
        
        confirmBtn.onclick = () => {
            callback();
            this.closeModals();
        };
        
        modal.style.display = 'flex';
    },
    
    // Update breadcrumbs
    updateBreadcrumbs(text) {
        document.getElementById('breadcrumbs').innerHTML = `<span>${text}</span>`;
    },
    
    // Toggle favorite status
    async toggleFavorite(bookmarkId, event) {
        event.preventDefault();
        event.stopPropagation();
        
        try {
            const bookmark = await API.getBookmark(bookmarkId);
            bookmark.is_favorite = !bookmark.is_favorite;
            await API.updateBookmark(bookmarkId, bookmark);
            
            await App.loadBookmarks();
            this.showToast(bookmark.is_favorite ? 'Toegevoegd aan favorieten' : 'Verwijderd uit favorieten', 'success');
        } catch (error) {
            this.showToast('Fout bij wijzigen favoriet', 'error');
        }
    },
    
    // Visit bookmark
    async visitBookmark(bookmarkId, event) {
        try {
            await API.visitBookmark(bookmarkId);
        } catch (error) {
            console.error('Error tracking visit:', error);
        }
    },
    
    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};