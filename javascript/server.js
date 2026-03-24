const http = require("http");
const fs = require("fs");
const path = require("path");

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

const requestListener = (req, res) => {
  // Normalize the request path
  let reqPath = req.url === '/' ? '/index.html' : req.url;
  
  // Strip query string - ?id=123 shouldn't affect file path
  reqPath = reqPath.split('?')[0];
  
  // Resolve path and check it stays within publicDir
  // The '.' prefix prevents absolute paths from being resolved incorrectly
  const safePath = path.resolve(publicDir, '.' + reqPath);
  
  // Critical security check: ensure resolved path is within publicDir
  if (!safePath.startsWith(publicDir)) {
    res.writeHead(403, { 'X-Content-Type-Options': 'nosniff' });
    res.end('Forbidden');
    return;
  }
  
  // Check if file exists and is actually a file (not a directory)
  fs.stat(safePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'X-Content-Type-Options': 'nosniff' });
      res.end('File not found');
      return;
    }
    
    // Determine MIME type from file extension
    const ext = path.extname(safePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    res.setHeader("Content-Type", contentType);
    res.setHeader("X-Content-Type-Options", "nosniff"); // Prevents MIME sniffing attacks
    res.writeHead(200);
    
    // Stream file instead of loading into memory
    // Critical for large files - won't consume all memory
    const stream = fs.createReadStream(safePath);
    stream.pipe(res);
    
    stream.on('error', () => {
      // File might be deleted between stat() and createReadStream()
      res.writeHead(500, { 'X-Content-Type-Options': 'nosniff' });
      res.end('Server error');
    });
  });
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
  console.log(`Serving static files from: ${publicDir}`);
});