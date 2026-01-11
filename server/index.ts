import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API Routes

// 1. Health Check
app.get('/api/health', async (req, res) => {
  try {
    // Simple query to check DB connection
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'connected', database: 'PostgreSQL', timestamp: new Date() });
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({ status: 'disconnected', error: 'Database connection failed' });
  }
});

// 2. Test DB Write
app.post('/api/test-db', async (req, res) => {
  try {
    const log = await prisma.systemLog.create({
      data: {
        message: 'Teste de gravação via Painel Panorama',
        status: 'OK'
      }
    });
    res.json(log);
  } catch (error) {
    console.error('Failed to write log:', error);
    res.status(500).json({ error: 'Failed to write to database' });
  }
});

// 3. List Logs
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await prisma.systemLog.findMany({
      take: 10,
      orderBy: {
        timestamp: 'desc'
      }
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Serve Frontend in Production
// Assuming the build output is in the root 'dist' folder relative to this server file
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback for SPA routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving static files from: ${distPath}`);
});