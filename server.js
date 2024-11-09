import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import https from 'https';
import fs from 'fs';
import morgan from 'morgan';

// Determine the directory of the current script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create an Express application
const app = express();

// Set the port numbers for HTTP and HTTPS
const httpPort = 3000;
const httpsPort = 3443;

// Serve static files from the root directory
app.use(express.static(__dirname));

// Use Morgan middleware for logging HTTP requests
app.use(morgan('combined'));

// Define a route for the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Read the SSL certificate and key
const options = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
};

// Create and start the HTTP server
const httpServer = http.createServer(app);
httpServer.listen(httpPort, '0.0.0.0', () => {
    console.log(`HTTP server running at http://localhost:${httpPort}`);
});

// Create and start the HTTPS server
const httpsServer = https.createServer(options, app);
httpsServer.listen(httpsPort, '0.0.0.0', () => {
    console.log(`HTTPS server running at https://localhost:${httpsPort}`);
});

// Log when an HTTP client connects
httpServer.on('connection', (socket) => {
    console.log(`HTTP client connected from ${socket.remoteAddress}:${socket.remotePort}`);
});

// Log when an HTTPS client connects
httpsServer.on('connection', (socket) => {
    console.log(`HTTPS client connected from ${socket.remoteAddress}:${socket.remotePort}`);
});

// Log details of incoming requests
app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    console.log(`Headers: ${JSON.stringify(req.headers, null, 2)}`);
    next();
});

// Additional logging for server errors
httpServer.on('error', (err) => {
    console.error(`HTTP server error: ${err}`);
});

httpsServer.on('error', (err) => {
    console.error(`HTTPS server error: ${err}`);
});

app.use((err, req, res, next) => {
    console.error(`Express error: ${err}`);
    res.status(500).send('Server error');
});