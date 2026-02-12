import db from '../database/db.js';

// Get all bookmarks with optional filtering
export const getAllBookmarks = (req, res) => {
  try {
    const { folder_id, is_favorite, search, tags } = req.query;
    
    let query = `
      SELECT 
        b.*,
        GROUP_CONCAT(t.name) as tags,
        GROUP_CONCAT(t.color) as tag_colors
      FROM bookmarks b
      LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id
      LEFT JOIN tags t ON bt.tag_id = t.id
      WHERE 1=1
    `;
    
    const params = [];

    if (folder_id) {
      query += ' AND b.folder_id = ?';
      params.push(folder_id);
    }

    if (is_favorite) {
      query += ' AND b.is_favorite = 1';
    }

    if (search) {
      query += ' AND (b.title LIKE ? OR b.description LIKE ? OR b.url LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (tags) {
      const tagNames = tags.split(',');
      query += ` AND t.name IN (${tagNames.map(() => '?').join(',')})`;
      params.push(...tagNames);
    }

    query += ' GROUP BY b.id ORDER BY b.created_at DESC';

    const bookmarks = db.prepare(query).all(...params);
    
    // Format the response
    const formattedBookmarks = bookmarks.map(b => ({
      ...b,
      tags: b.tags ? b.tags.split(',').filter(Boolean) : [],
      tag_colors: b.tag_colors ? b.tag_colors.split(',').filter(Boolean) : [],
      is_favorite: Boolean(b.is_favorite)
    }));

    res.json(formattedBookmarks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single bookmark by ID
export const getBookmarkById = (req, res) => {
  try {
    const { id } = req.params;
    
    const bookmark = db.prepare(`
      SELECT 
        b.*,
        GROUP_CONCAT(t.name) as tags,
        GROUP_CONCAT(t.color) as tag_colors
      FROM bookmarks b
      LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id
      LEFT JOIN tags t ON bt.tag_id = t.id
      WHERE b.id = ?
      GROUP BY b.id
    `).get(id);

    if (!bookmark) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    const formattedBookmark = {
      ...bookmark,
      tags: bookmark.tags ? bookmark.tags.split(',').filter(Boolean) : [],
      tag_colors: bookmark.tag_colors ? bookmark.tag_colors.split(',').filter(Boolean) : [],
      is_favorite: Boolean(bookmark.is_favorite)
    };

    res.json(formattedBookmark);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new bookmark
export const createBookmark = (req, res) => {
  try {
    const { title, url, description, folder_id, favicon_url, tags } = req.body;

    if (!title || !url) {
      return res.status(400).json({ error: 'Title and URL are required' });
    }

    const insert = db.prepare(`
      INSERT INTO bookmarks (title, url, description, folder_id, favicon_url, is_favorite)
      VALUES (?, ?, ?, ?, ?, 0)
    `);

    const result = insert.run(title, url, description, folder_id || null, favicon_url || null);

    // Add tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
      const linkTag = db.prepare('INSERT INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)');
      
      tags.forEach(tagName => {
        const tagResult = insertTag.run(tagName);
        const tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(tagName);
        if (tag) {
          linkTag.run(result.lastInsertRowid, tag.id);
        }
      });
    }

    // Return the created bookmark
    const newBookmark = db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json(newBookmark);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a bookmark
export const updateBookmark = (req, res) => {
  try {
    const { id } = req.params;
    const { title, url, description, folder_id, favicon_url, is_favorite, tags } = req.body;

    // Check if bookmark exists
    const existing = db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    // Update bookmark
    const update = db.prepare(`
      UPDATE bookmarks
      SET title = COALESCE(?, title),
          url = COALESCE(?, url),
          description = COALESCE(?, description),
          folder_id = COALESCE(?, folder_id),
          favicon_url = COALESCE(?, favicon_url),
          is_favorite = COALESCE(?, is_favorite),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    update.run(
      title, url, description, folder_id, favicon_url,
      is_favorite !== undefined ? (is_favorite ? 1 : 0) : undefined,
      id
    );

    // Update tags if provided
    if (tags !== undefined) {
      // Remove existing tag associations
      db.prepare('DELETE FROM bookmark_tags WHERE bookmark_id = ?').run(id);
      
      // Add new tag associations
      if (Array.isArray(tags) && tags.length > 0) {
        const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
        const linkTag = db.prepare('INSERT INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)');
        
        tags.forEach(tagName => {
          insertTag.run(tagName);
          const tag = db.prepare('SELECT id FROM tags WHERE name = ?').get(tagName);
          if (tag) {
            linkTag.run(id, tag.id);
          }
        });
      }
    }

    // Return updated bookmark
    const updatedBookmark = db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(id);
    res.json(updatedBookmark);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a bookmark
export const deleteBookmark = (req, res) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    db.prepare('DELETE FROM bookmarks WHERE id = ?').run(id);
    res.json({ message: 'Bookmark deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Increment visit count
export const visitBookmark = (req, res) => {
  try {
    const { id } = req.params;

    db.prepare(`
      UPDATE bookmarks
      SET visit_count = visit_count + 1,
          last_visited = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    const bookmark = db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(id);
    
    if (!bookmark) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    res.json(bookmark);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};