import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const router = express.Router();

const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://localhost:8000';

// Create proxy middleware for all Django backend endpoints
const djangoProxy = createProxyMiddleware({
  target: DJANGO_API_URL,
  changeOrigin: true,
  ws: true,
  pathRewrite: {
    '^/': '/api/'  // Add /api prefix when forwarding to Django
  },
  onProxyReq: (proxyReq, req, res) => {
    // Forward the authorization header if present
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }
    // Log the proxy request for debugging
    console.log(`[Django Proxy] ${req.method} /api${req.path} -> ${DJANGO_API_URL}/api${req.path}`);
  },
  onError: (err, req, res) => {
    console.error('[Django Proxy Error]:', err);
    res.status(502).json({ 
      error: 'Failed to connect to Django backend',
      detail: err.message 
    });
  }
});

// Proxy all /api/* requests to Django backend
router.use('/*', djangoProxy);

export default router;