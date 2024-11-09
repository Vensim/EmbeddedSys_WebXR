import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import fs from 'fs';
import morgan from 'morgan';

// Directory path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpPort = 3000;
const httpsPort = 3443;

// Middleware for logging
app.use(morgan('combined'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Default route for index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Load SSL certificate and key
const options = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
};

// Create HTTPS server
const httpsServer = https.createServer(options, app);
httpsServer.listen(httpsPort, '0.0.0.0', () => {
    console.log(`HTTPS server running at https://localhost:${httpsPort}`);
});

// Redirect HTTP to HTTPS
app.listen(httpPort, () => {
    console.log(`HTTP server running at http://localhost:${httpPort}`);
});