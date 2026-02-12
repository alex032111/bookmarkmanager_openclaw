import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bookmarkRoutes from './routes/bookmarkRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import tagRoutes from './routes/tagRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/tags', tagRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'OpenClaw Bookmark Manager API',
    version: '1.0.0',
    endpoints: {
      bookmarks: '/api/bookmarks',
      folders: '/api/folders',
      tags: '/api/tags'
    },
    documentation: {
      bookmarks: {
        'GET /api/bookmarks': 'Get all bookmarks (supports ?folder_id, ?is_favorite, ?search, ?tags)',
        'GET /api/bookmarks/:id': 'Get a single bookmark',
        'POST /api/bookmarks': 'Create a new bookmark',
        'PUT /api/bookmarks/:id': 'Update a bookmark',
        'DELETE /api/bookmarks/:id': 'Delete a bookmark',
        'POST /api/bookmarks/:id/visit': 'Track bookmark visit'
      },
      folders: {
        'GET /api/folders': 'Get all folders',
        'GET /api/folders/tree': 'Get folder tree structure',
        'GET /api/folders/:id': 'Get a folder with its bookmarks',
        'POST /api/folders': 'Create a new folder',
        'PUT /api/folders/:id': 'Update a folder',
        'DELETE /api/folders/:id': 'Delete a folder'
      },
      tags: {
        'GET /api/tags': 'Get all tags',
        'GET /api/tags/popular': 'Get popular tags',
        'GET /api/tags/:id': 'Get a tag with its bookmarks',
        'POST /api/tags': 'Create a new tag',
        'PUT /api/tags/:id': 'Update a tag',
        'DELETE /api/tags/:id': 'Delete a tag'
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║     OpenClaw Bookmark Manager API Server         ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`📚 API Documentation at http://localhost:${PORT}/`);
  console.log(`💚 Health check at http://localhost:${PORT}/health\n`);
});

export default app;