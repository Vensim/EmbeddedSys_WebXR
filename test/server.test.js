import { expect } from 'chai';
import request from 'supertest';
import fs from 'fs';
import WebSocket from 'ws';
import { expressServer } from '../server.js'; // Adjust according to your setup

const httpsPort = 3443;
let ws;

describe('WebSocket Server', function() {
    this.timeout(5000); // Extend default timeout for the entire test suite
    before((done) => {
        expressServer.start(); // Start the server before running tests

        ws = new WebSocket(`wss://localhost:${httpsPort}`, {
            rejectUnauthorized: false // Ignore self-signed certificate in test
        });

        ws.on('open', () => {
            console.log('WebSocket connection established.');
            done();
        });

        ws.on('error', (error) => {
            done(error);
        });

    });

    after((done) => {
        expressServer.close(); // Close the server after running tests

        if (ws) {
            ws.on('close', () => {
                console.log('WebSocket connection closed.');
                done();
            });
            ws.close();
        } else {
            done();
        }
    });



    it('should establish a WebSocket connection', (done) => {
        expect(ws.readyState).to.equal(WebSocket.OPEN);
        done();
    });

    it('should send and receive a single message', (done) => {
        ws.once('message', (message) => {
            expect(message.toString()).to.equal('Hello');
            done();
        });

        ws.send('Hello');
    });

    it('should send and receive a series of messages', function(done) {
        this.timeout(3000); // Extend timeout for this specific test

        const messagesToSend = ['Hello', 'How are you?', 'Goodbye'];
        let messageIndex = 0;

        ws.on('message', function messageHandler(message) {
            expect(message.toString()).to.equal(messagesToSend[messageIndex]);
            messageIndex++;

            if (messageIndex >= messagesToSend.length) {
                ws.removeListener('message', messageHandler);
                done();
            } else {
                ws.send(messagesToSend[messageIndex]);
            }
        });

        // Start by sending the first message
        ws.send(messagesToSend[messageIndex]);
    });
});