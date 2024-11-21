import asyncio
import websockets
import json
import random
import ssl

# Create an SSL context with the appropriate protocol
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE  # Use only in development for self-signed certificates

async def send_messages(uri):
    async with websockets.connect(uri, ssl=ssl_context) as websocket:
        while True:
            message = {
                "type": "updateDisplay",
                "index": random.randint(0, 9),  # Mock index
                "content": f"Updated Content {random.randint(0, 100)}"
            }
            await websocket.send(json.dumps(message))
            print(f"Sent: {message}")
            await asyncio.sleep(5)  # Send a message every 5 seconds

if __name__ == "__main__":
    uri = "wss://localhost:3443"
    # Proper event loop management
    asyncio.run(send_messages(uri))