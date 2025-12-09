import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000'], // your frontend URL
  },
})
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  // Generic method to emit notifications
  sendNotification(event: string, payload: any) {
    this.server.emit(event, payload);
  }
}
