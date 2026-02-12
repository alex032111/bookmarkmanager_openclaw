import db from '../database/db.js';

// Get all folders
export const getAllFolders = (req, res) => {
  try {
    const folders = db.prepare(`
      SELECT 
        f.*,
        COUNT(b.id) as bookmark_count,
        (SELECT COUNT(*) FROM folders WHERE parent_id = f.id) as subfolder_count
      FROM folders f
      LEFT JOIN bookmarks b ON f.id = b.folder_id
      GROUP BY f.id
      ORDER BY f.name
    `).all();

    res.json(folders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get folder tree structure
export const getFolderTree = (req, res) => {
  try {
    // Recursive function to build tree
    function buildTree(parentId = null) {
      const folders = db.prepare(`
        SELECT 
          f.*,
          COUNT(b.id) as bookmark_count
        FROM folders f
        LEFT JOIN bookmarks b ON f.id = b.folder_id
        WHERE f.parent_id IS ?
        GROUP BY f.id
        ORDER BY f.name
      `).all(parentId);

      return folders.map(folder => ({
        ...folder,
        children: buildTree(folder.id)
      }));
    }

    const tree = buildTree(null);
    res.json(tree);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single folder by ID
export const getFolderById = (req, res) => {
  try {
    const { id } = req.params;

    const folder = db.prepare(`
      SELECT 
        f.*,
        COUNT(b.id) as bookmark_count
      FROM folders f
      LEFT JOIN bookmarks b ON f.id = b.folder_id
      WHERE f.id = ?
      GROUP BY f.id
    `).get(id);

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Get bookmarks in this folder
    const bookmarks = db.prepare(`
      SELECT 
        b.*,
        GROUP_CONCAT(t.name) as tags,
        GROUP_CONCAT(t.color) as tag_colors
      FROM bookmarks b
      LEFT JOIN bookmark_tags bt ON b.id = bt.bookmark_id
      LEFT JOIN tags t ON bt.tag_id = t.id
      WHERE b.folder_id = ?
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `).all(id);

    const formattedBookmarks = bookmarks.map(b => ({
      ...b,
      tags: b.tags ? b.tags.split(',').filter(Boolean) : [],
      tag_colors: b.tag_colors ? b.tag_colors.split(',').filter(Boolean) : [],
      is_favorite: Boolean(b.is_favorite)
    }));

    res.json({
      ...folder,
      bookmarks: formattedBookmarks
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new folder
export const createFolder = (req, res) => {
  try {
    const { name, description, parent_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const insert = db.prepare(`
      INSERT INTO folders (name, description, parent_id)
      VALUES (?, ?, ?)
    `);

    const result = insert.run(name, description || null, parent_id || null);

    const newFolder = db.prepare('SELECT * FROM folders WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json(newFolder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a folder
export const updateFolder = (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parent_id } = req.body;

    const existing = db.prepare('SELECT * FROM folders WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Prevent circular references
    if (parent_id) {
      function isDescendant(folderId, ancestorId) {
        let currentId = folderId;
        while (currentId !== null) {
          if (currentId === ancestorId) return true;
          const parent = db.prepare('SELECT parent_id FROM folders WHERE id = ?').get(currentId);
          currentId = parent ? parent.parent_id : null;
        }
        return false;
      }

      if (isDescendant(parseInt(id), parseInt(parent_id))) {
        return res.status(400).json({ error: 'Cannot move folder into its own descendant' });
      }
    }

    const update = db.prepare(`
      UPDATE folders
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          parent_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    update.run(name, description, parent_id || null, id);

    const updatedFolder = db.prepare('SELECT * FROM folders WHERE id = ?').get(id);
    res.json(updatedFolder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a folder
export const deleteFolder = (req, res) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM folders WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Move bookmarks to parent folder or set to null
    const parent = db.prepare('SELECT parent_id FROM folders WHERE id = ?').get(id);
    db.prepare('UPDATE bookmarks SET folder_id = ? WHERE folder_id = ?').run(parent ? parent.parent_id : null, id);

    // Delete folder (cascade will delete subfolders)
    db.prepare('DELETE FROM folders WHERE id = ?').run(id);

    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};