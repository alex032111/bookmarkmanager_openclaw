import express from 'express';
import * as tagController from '../controllers/tagController.js';

const router = express.Router();

// GET /api/tags - Get all tags
router.get('/', tagController.getAllTags);

// GET /api/tags/popular - Get popular/most used tags
router.get('/popular', tagController.getPopularTags);

// GET /api/tags/:id - Get a single tag with its bookmarks
router.get('/:id', tagController.getTagById);

// POST /api/tags - Create a new tag
router.post('/', tagController.createTag);

// PUT /api/tags/:id - Update a tag
router.put('/:id', tagController.updateTag);

// DELETE /api/tags/:id - Delete a tag
router.delete('/:id', tagController.deleteTag);

export default router;