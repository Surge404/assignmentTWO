import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { quizRouter } from './routes/quiz.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/quiz', quizRouter);

const preferredPorts = [4000];
if (process.env.PORT && Number(process.env.PORT) !== 4000) {
  preferredPorts.push(Number(process.env.PORT));
}

async function startServer(ports) {
  for (const port of ports) {
    try {
      await new Promise((resolve, reject) => {
        const server = app.listen(port, () => {
          console.log(`Server listening on http://localhost:${port}`);
          resolve(server);
        });
        server.on('error', (err) => {
          if (err?.code === 'EADDRINUSE') {
            console.warn(`Port ${port} in use, trying next...`);
            reject(err);
          } else {
            reject(err);
          }
        });
      });
      return; // started
    } catch (e) {
      // try next port
    }
  }
  console.error('Failed to bind any port. Exiting.');
  process.exit(1);
}

startServer(preferredPorts);
