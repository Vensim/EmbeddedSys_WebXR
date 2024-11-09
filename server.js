import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the root directory
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Bind to '0.0.0.0' to listen on all network interfaces
app.listen(port, '0.0.0.0', () => {
    console.log(`App running at http://0.0.0.0:${port}`);
});