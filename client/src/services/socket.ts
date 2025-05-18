import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Initialize Socket.io client connection
 */
export const initializeSocket = (): Socket => {
  if (!socket) {
    // Connect to the Socket.io server
    socket = io('http://localhost:5000', {
      transports: ['websocket'],
      autoConnect: true,
    });

    // Set up connection event listeners
    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  return socket;
};

/**
 * Join a screening room to get updates for that screening
 */
export const joinScreeningRoom = (screeningId: string): void => {
  if (socket && socket.connected) {
    console.log('Joining screening room:', screeningId);
    socket.emit('join-screening', screeningId);
  }
};

/**
 * Listen for seat updates for a screening
 */
export const subscribeToSeatUpdates = (
  callback: (data: { screeningId: string }) => void
): void => {
  if (socket) {
    // Remove any existing listeners to prevent duplicates
    socket.off('seats-updated');
    
    // Add the new listener
    socket.on('seats-updated', callback);
  }
};

/**
 * Clean up socket connection and listeners
 */
export const cleanupSocket = (): void => {
  if (socket) {
    socket.off('seats-updated');
    socket.disconnect();
    socket = null;
  }
};

export default {
  initializeSocket,
  joinScreeningRoom,
  subscribeToSeatUpdates,
  cleanupSocket,
};
