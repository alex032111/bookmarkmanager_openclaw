import express from 'express';
import * as folderController from '../controllers/folderController.js';

const router = express.Router();

// GET /api/folders - Get all folders
router.get('/', folderController.getAllFolders);

// GET /api/folders/tree - Get folder tree structure
router.get('/tree', folderController.getFolderTree);

// GET /api/folders/:id - Get a single folder with its bookmarks
router.get('/:id', folderController.getFolderById);

// POST /api/folders - Create a new folder
router.post('/', folderController.createFolder);

// PUT /api/folders/:id - Update a folder
router.put('/:id', folderController.updateFolder);

// DELETE /api/folders/:id - Delete a folder
router.delete('/:id', folderController.deleteFolder);

export default router;