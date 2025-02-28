import { chatStore } from '../store/chatStore';
import { ApiEvent, Channel, Message } from '../types';
import { connectToEventApi, sendEvent, subscribeToChannel, unsubscribeFromChannel } from '../utils/api';
import { logMessage, logObject } from '../utils/log';

// Environment variables
const HTTP_ENDPOINT = import.meta.env.VITE_HTTP_ENDPOINT;
const REALTIME_ENDPOINT = import.meta.env.VITE_REALTIME_ENDPOINT;
const API_KEY = import.meta.env.VITE_API_KEY;

// Default authorization headers
const createAuthorization = (password?: string | null): Record<string, string> => {
  const auth: Record<string, string> = {
    'x-api-key': API_KEY,
    host: HTTP_ENDPOINT
  };
  
  if (password) {
    auth['Authorization'] = password;
  }
  
  return auth;
};

// Message handlers
type MessageHandler = (username: string, message: string, timestamp?: string, className?: string) => void;

export class ChatService {
  private ownMessageHandler: MessageHandler;
  private otherMessageHandler: MessageHandler;
  private serverMessageHandler: MessageHandler;
  
  constructor(
    ownMessageHandler: MessageHandler,
    otherMessageHandler: MessageHandler,
    serverMessageHandler: MessageHandler
  ) {
    this.ownMessageHandler = ownMessageHandler;
    this.otherMessageHandler = otherMessageHandler;
    this.serverMessageHandler = serverMessageHandler;
  }

  // Connect to WebSocket API
  async connect(): Promise<void> {
    try {
      const socket = await connectToEventApi({
        realtimeDomain: REALTIME_ENDPOINT,
        authorization: createAuthorization(),
        onMessage: this.handleMessage.bind(this)
      });
      
      chatStore.setState({ socket });
      logMessage('Connected to chat service');
    } catch (error) {
      logMessage('Failed to connect to chat service');
      console.error(error);
    }
  }

  // Subscribe to a channel
  subscribeToChannel(channel: Channel, password?: string): void {
    const state = chatStore.getState();
    if (!state.socket) {
      logMessage('Socket not connected');
      return;
    }

    const { socket, sessionId, username } = state;
    if (!username) {
      logMessage('Username not set');
      return;
    }

    const auth = createAuthorization(password);
    
    subscribeToChannel({
      socket, 
      channel, 
      authorization: auth,
      id: `${channel.slice(1)}-${sessionId}`
    });
    
    chatStore.setState({ channel, password: password || null });
    logMessage(`Subscribed to ${channel} channel`);
  }

  // Unsubscribe from a channel
  unsubscribeFromChannel(): void {
    const state = chatStore.getState();
    const { socket, channel, sessionId } = state;
    
    if (!socket || !channel) {
      return;
    }

    const auth = createAuthorization(state.password);
    
    unsubscribeFromChannel({
      socket,
      channel,
      authorization: auth,
      id: `${channel.slice(1)}-${sessionId}`
    });
    
    logMessage(`Unsubscribed from ${channel} channel`);
  }

  // Send a message
  sendMessage(message: string): void {
    const state = chatStore.getState();
    const { username, channel, password } = state;
    
    if (!username || !channel) {
      logMessage('Cannot send message: missing username or channel');
      return;
    }
    
    const auth = createAuthorization(password);
    
    logMessage(`Sending message through ${channel}: ${message}`);
    
    sendEvent({
      event: {
        message,
        username,
      },
      channel,
      httpDomain: HTTP_ENDPOINT,
      authorization: auth,
    });
  }

  // Handle incoming messages
  private handleMessage(event: MessageEvent): void {
    const data = JSON.parse(event.data) as ApiEvent;
    const username = chatStore.getState().username;

    logObject(data, 'Received data');
    
    if (data.type === 'data') {
      const message = JSON.parse(data.event) as Message;
      logObject(message, 'Received message');

      if (message.username === username) {
        this.ownMessageHandler(message.username, message.message, message.timestamp);
      } else {
        this.otherMessageHandler(message.username, message.message, message.timestamp);
      }
    } else if (data.type === 'subscribe_error') {
      logMessage('Failed to subscribe to channel');
      const errorType = data?.errors?.[0]?.errorType;
      if (errorType) {
        this.serverMessageHandler('Server', errorType, undefined, 'animate-shake');
      }
    } else if (data.type === 'subscribe_success') {
      logMessage('Subscribed to channel');
      const channel = chatStore.getState().channel;
      this.serverMessageHandler('Server', `Welcome to the ${channel?.slice(1)} channel`);
    }
  }
} 