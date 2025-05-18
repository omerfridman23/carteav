import { Server as SocketServer } from 'socket.io';
import http from 'http';

/**
 * Socket service to handle real-time communication
 */
export class SocketService {
  private static instance: SocketService;
  private io: SocketServer | null = null;

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  /**
   * Initialize the socket server
   */
  public initialize(server: http.Server): void {
    this.io = new SocketServer(server, {
      cors: {
        origin: '*', // In production, restrict this to your frontend domain
        methods: ['GET', 'POST']
      }
    });

    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('join-screening', (screeningId: string) => {
        console.log(`Client ${socket.id} joined screening room: ${screeningId}`);
        // Leave all other screening rooms
        socket.rooms.forEach(room => {
          if (room !== socket.id && room.startsWith('screening-')) {
            socket.leave(room);
          }
        });
        // Join the new screening room
        socket.join(`screening-${screeningId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    console.log('Socket.io server initialized');
  }

  /**
   * Emit a seats-updated event to clients viewing a specific screening
   */
  public emitSeatsUpdated(screeningId: string): void {
    if (this.io) {
      console.log(`Emitting seats-updated event for screening: ${screeningId}`);
      this.io.to(`screening-${screeningId}`).emit('seats-updated', { screeningId });
    }
  }
}

export default SocketService.getInstance();
