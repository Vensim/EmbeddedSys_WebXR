import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import fs from 'fs';
import morgan from 'morgan';
import WebSocket, { WebSocketServer } from 'ws';

// Directory path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const expressServer = express();
const httpPort = 3000;
const httpsPort = 3443;

let httpsServer;

// Middleware for logging
expressServer.use(morgan('combined'));

// Path to your log file
const logFilePath = path.join(__dirname, 'server.log');

// Function to append log messages to file
function logToFile(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}\n`;
    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) {
            console.error('Error writing to log file', err);
        }
    });
}

// Serve static files
expressServer.use(express.static(path.join(__dirname, 'public')));

// Default route for index.html
expressServer.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Load SSL certificate and key
const options = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
};

// Create WebSocket server
let wss;

expressServer.start = (callback) => {
    // Create HTTPS server
    httpsServer = https.createServer(options, expressServer);
    httpsServer.listen(httpsPort, '0.0.0.0', () => {
        console.log(`HTTPS server running at https://localhost:${httpsPort}`);
    });

    // Create WebSocket server and attach to HTTPS server
    wss = new WebSocketServer({ server: httpsServer });

    wss.on('headers', (headers, request) => {
        logToFile('Client attempted to connect');
        logToFile(`Headers: ${JSON.stringify(headers)}`);
        logToFile(`Remote Address: ${request.socket.remoteAddress}`);
    });

    wss.on('connection', (ws) => {
        logToFile('Client connected');
        ws.on('message', (message) => {
            logToFile(`Received: ${message}`);
            // Broadcast the message to all connected clients
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        });

        ws.on('close', () => {
            logToFile('Client disconnected');
        });
    });

    // Start HTTP server for redirect
    // httpServer = expressServer.listen(httpPort, () => {
    //     console.log(`HTTP server running at http://localhost:${httpPort}`);
    // });

    // Call the callback to indicate the server has started
    if (typeof callback === 'function') {
        callback();
    }

};

expressServer.close = (callback) => {
    // if (httpServer) {
    //     httpServer.close(() => {
    //         console.log('HTTP server closed.');
    //     });
    // }
    if (httpsServer) {
        httpsServer.close(() => {
            console.log('HTTPS server closed.');
            if (typeof callback === 'function') callback();
        });
    } else {
        if (typeof callback === 'function') callback();
    }
};


export { expressServer };