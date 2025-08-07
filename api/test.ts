import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.json({ 
    message: 'Test API working!',
    timestamp: new Date().toISOString()
  });
} 