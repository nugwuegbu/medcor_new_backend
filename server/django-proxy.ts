import { RequestHandler } from 'express';
import fetch from 'node-fetch';

const DJANGO_BASE_URL = process.env.DJANGO_BASE_URL || 'http://localhost:8001';

export const createDjangoProxy = (path: string): RequestHandler => {
  return async (req, res) => {
    try {
      const djangoUrl = `${DJANGO_BASE_URL}${path}`;
      
      // Forward the request to Django
      const response = await fetch(djangoUrl, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          ...req.headers,
        },
        body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
      });

      const data = await response.json();
      
      // Forward Django response back to client
      res.status(response.status).json(data);
    } catch (error) {
      console.error('Django proxy error:', error);
      res.status(500).json({ 
        error: 'Django service unavailable',
        message: 'The admin service is temporarily unavailable' 
      });
    }
  };
};

export const adminAuthProxy: RequestHandler = createDjangoProxy('/api/admin/login/');
export const adminStatsProxy: RequestHandler = createDjangoProxy('/api/tenants/clients/stats/');
export const adminProfileProxy: RequestHandler = createDjangoProxy('/api/admin/profile/');
export const adminLogoutProxy: RequestHandler = createDjangoProxy('/api/admin/logout/');