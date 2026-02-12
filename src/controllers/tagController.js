import db from '../database/db.js';

// Get all tags with bookmark counts
export const getAllTags = (req, res) => {
  try {
    const tags = db.prepare(`
      SELECT 
        t.*,
        COUNT(bt.bookmark_id) as bookmark_count
      FROM tags t
      LEFT JOIN bookmark_tags bt ON t.id = bt.tag_id
      GROUP BY t.id
      ORDER BY t.name
    `).all();

    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single tag by ID
export const getTagById = (req, res) => {
  try {
    const { id } = req.params;

    const tag = db.prepare(`
      SELECT 
        t.*,
        COUNT(bt.bookmark_id) as bookmark_count
      FROM tags t
      LEFT JOIN bookmark_tags bt ON t.id = bt.tag_id
      WHERE t.id = ?
      GROUP BY t.id
    `).get(id);

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // Get bookmarks with this tag
    const bookmarks = db.prepare(`
      SELECT 
        b.*,
        GROUP_CONCAT(t2.name) as tags,
        GROUP_CONCAT(t2.color) as tag_colors
      FROM bookmarks b
      INNER JOIN bookmark_tags bt ON b.id = bt.bookmark_id
      LEFT JOIN bookmark_tags bt2 ON b.id = bt2.bookmark_id
      LEFT JOIN tags t2 ON bt2.tag_id = t2.id
      WHERE bt.tag_id = ?
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
      ...tag,
      bookmarks: formattedBookmarks
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new tag
export const createTag = (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const insert = db.prepare(`
      INSERT INTO tags (name, color)
      VALUES (?, COALESCE(?, '#3b82f6'))
    `);

    const result = insert.run(name, color);

    const newTag = db.prepare('SELECT * FROM tags WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json(newTag);
  } catch (error) {
    // Handle unique constraint violation
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Tag with this name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Update a tag
export const updateTag = (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    const existing = db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const update = db.prepare(`
      UPDATE tags
      SET name = COALESCE(?, name),
          color = COALESCE(?, color)
      WHERE id = ?
    `);

    update.run(name, color, id);

    const updatedTag = db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
    res.json(updatedTag);
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Tag with this name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Delete a tag
export const deleteTag = (req, res) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    db.prepare('DELETE FROM tags WHERE id = ?').run(id);

    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get popular tags (most used)
export const getPopularTags = (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const tags = db.prepare(`
      SELECT 
        t.*,
        COUNT(bt.bookmark_id) as bookmark_count
      FROM tags t
      INNER JOIN bookmark_tags bt ON t.id = bt.tag_id
      GROUP BY t.id
      ORDER BY bookmark_count DESC
      LIMIT ?
    `).all(limit);

    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};