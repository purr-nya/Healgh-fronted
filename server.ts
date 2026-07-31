import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import next from 'next';
import { parse } from 'url';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  const httpServer = createServer(server);
  const wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket server');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        // Broadcast the received data from watch to all connected clients (browsers)
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      } catch (e) {
        console.error('Failed to parse incoming message', e);
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
    });
  });

  // Let Next.js handle all other routes
  server.all(/.*/, (req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const PORT = parseInt(process.env.PORT || '3000', 10);
  const HOST = process.env.HOST || '0.0.0.0';
  httpServer.listen(PORT, HOST, () => {
    console.log(`> Server ready on http://${HOST}:${PORT}`);
  });
}).catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
