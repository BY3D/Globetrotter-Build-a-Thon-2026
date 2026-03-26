const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const agentsAPI = require("./agents-api.js");

const host = 'localhost';
const port = 8000;

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf'
};

const publicDir = path.resolve(__dirname, '../ui/');

// Helper: parse request body
const parseBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
};

const requestListener = async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Enable CORS for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API route: POST /api/chat
  if (pathname === '/api/chat' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const userInput = body.message;

      if (!userInput) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Message required' }));
        return;
      }

      const result = await agentsAPI.processUserInput(userInput);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (error) {
      console.error('API Error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // API route: GET /api/health
  if (pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  // API route: POST /api/clear-chat
  if (pathname === '/api/clear-chat' && req.method === 'POST') {
    try {
      agentsAPI.clearChatHistory();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'Chat history cleared' }));
    } catch (error) {
      console.error('Clear chat error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // Static file serving
  let reqPath = pathname === '/' ? '/index.html' : pathname;
  
  // Strip query string
  reqPath = reqPath.split('?')[0];
  
  // Resolve path and check it stays within publicDir
  const safePath = path.resolve(publicDir, '.' + reqPath);
  
  // Security check: ensure resolved path is within publicDir
  if (!safePath.startsWith(publicDir)) {
    res.writeHead(403, { 'X-Content-Type-Options': 'nosniff' });
    res.end('Forbidden');
    return;
  }
  
  // Check if file exists and is actually a file
  fs.stat(safePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'X-Content-Type-Options': 'nosniff' });
      res.end('File not found');
      return;
    }
    
    const ext = path.extname(safePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    res.setHeader("Content-Type", contentType);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.writeHead(200);
    
    const stream = fs.createReadStream(safePath);
    stream.pipe(res);
    
    stream.on('error', () => {
      res.writeHead(500, { 'X-Content-Type-Options': 'nosniff' });
      res.end('Server error');
    });
  });
};

const server = http.createServer(requestListener);

// Initialize agents when server starts
agentsAPI.initialize()
  .then(() => {
    server.listen(port, host, () => {
      console.log(`Server is running on http://${host}:${port}`);
      console.log(`Serving static files from: ${publicDir}`);
      console.log(`API endpoint: POST http://${host}:${port}/api/chat`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialise agents:', error);
    process.exit(1);
  });