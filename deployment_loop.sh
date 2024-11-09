#!/bin/bash

PORT=3443


is_port_in_use() {
  if lsof -i:$PORT >/dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}


kill_process_on_port() {
  PORT_PID=$(lsof -t -i:$PORT)
  if [ -n "$PORT_PID" ]; then
    echo "Killing process $PORT_PID using port $PORT..."
    kill -SIGINT "$PORT_PID"

    WAIT_TIME=10
    while kill -0 "$PORT_PID" 2>/dev/null; do
      if [ "$WAIT_TIME" -le 0 ]; then
        echo "Process did not terminate gracefully in time, forcefully terminating..."
        kill -KILL "$PORT_PID"
        break
      fi
      sleep 1
      WAIT_TIME=$((WAIT_TIME - 1))
    done

    echo "Process using port $PORT has been shut down."
  else
    echo "No process is using port $PORT."
  fi
}

shutdown_application() {
  APP_PID=$(pgrep -f "npm start")

  if [ -n "$APP_PID" ]; then
    echo "Gracefully shutting down the application with PID $APP_PID..."

    # SIGINT is graceful shutdown for application
    kill -SIGINT "$APP_PID"

    WAIT_TIME=10
    while kill -0 "$APP_PID" 2>/dev/null; do
      if [ "$WAIT_TIME" -le 0 ]; then
        echo "Application did not shut down gracefully in time, forcefully terminating..."
        kill -KILL "$APP_PID"
        break
      fi
      sleep 1
      WAIT_TIME=$((WAIT_TIME - 1))
    done

    echo "Application has been shut down."
  else
    echo "No running application to shut down gracefully."
  fi
}

restart_application() {
  echo "New updates found. Rebuilding and restarting the application..."

  echo "Installing npm dependencies..."
  npm install

  echo "Running the build script..."
  npm run build

  shutdown_application

  while is_port_in_use; do
    kill_process_on_port
    sleep 5
  done

  echo "Starting the application..."
  npm start &

  echo "The application has been updated, built, and started successfully."
}

while true; do
  echo "Checking for updates..."

  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

  git fetch origin

  LOCAL_COMMIT=$(git rev-parse HEAD)
  REMOTE_COMMIT=$(git rev-parse origin/$CURRENT_BRANCH)

  if [ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]; then
    # Pull the latest changes on current branch
    echo "New content found on branch $CURRENT_BRANCH. Pulling the latest changes..."
    git pull origin $CURRENT_BRANCH

    # Restart the application
    restart_application
  else
    echo "No new updates found on branch $CURRENT_BRANCH. Checking again after a short delay..."
  fi

  # Frequency to check
  sleep 5
done