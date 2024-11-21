import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    entry: './src/main.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'public')
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                }
            }
        ]
    },

    mode: 'development',
    devServer: {
        static: path.join(__dirname, 'public'),
        compress: true,
        client: {
            logging: 'none',
        },
        port: 3443,
        https: {
            key: './server.key',
            cert: './server.cert',
        }
    },

    stats : 'minimal',
};