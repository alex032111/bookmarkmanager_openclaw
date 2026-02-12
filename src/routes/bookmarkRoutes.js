import express from 'express';
import * as bookmarkController from '../controllers/bookmarkController.js';

const router = express.Router();

// GET /api/bookmarks - Get all bookmarks with optional filtering
router.get('/', bookmarkController.getAllBookmarks);

// GET /api/bookmarks/favorites - Get all favorite bookmarks
router.get('/favorites', bookmarkController.getAllBookmarks);

// GET /api/bookmarks/:id - Get a single bookmark
router.get('/:id', bookmarkController.getBookmarkById);

// POST /api/bookmarks - Create a new bookmark
router.post('/', bookmarkController.createBookmark);

// PUT /api/bookmarks/:id - Update a bookmark
router.put('/:id', bookmarkController.updateBookmark);

// DELETE /api/bookmarks/:id - Delete a bookmark
router.delete('/:id', bookmarkController.deleteBookmark);

// POST /api/bookmarks/:id/visit - Track bookmark visit
router.post('/:id/visit', bookmarkController.visitBookmark);

export default router;