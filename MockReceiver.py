import asyncio
import websockets
import ssl

# Create an SSL context with the appropriate protocol
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE  # Use only in development for self-signed certificates

async def receive_messages(uri):
    async with websockets.connect(uri, ssl=ssl_context) as websocket:
        while True:
            try:
                message = await websocket.recv()
                print(f"Received: {message}")
            except websockets.exceptions.ConnectionClosed as e:
                print(f"Connection closed: {e}")
                break

if __name__ == "__main__":
    uri = "wss://localhost:3443"
    # Proper event loop management
    asyncio.run(receive_messages(uri))