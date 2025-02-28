import { Channel } from '../types';

interface ChatState {
  username: string | null;
  sessionId: string;
  channel: Channel | null;
  password: string | null;
  socket: WebSocket | null;
}

type Observer = (state: ChatState) => void;

class ChatStore {
  private state: ChatState = {
    username: null,
    sessionId: crypto.randomUUID(),
    channel: null,
    password: null,
    socket: null,
  };

  private observers: Observer[] = [];

  // Get current state
  getState(): ChatState {
    return { ...this.state };
  }

  // Update state and notify observers
  setState(partial: Partial<ChatState>): void {
    this.state = { ...this.state, ...partial };
    this.notifyObservers();
  }

  // Subscribe to state changes
  subscribe(observer: Observer): () => void {
    this.observers.push(observer);
    
    // Return unsubscribe function
    return () => {
      this.observers = this.observers.filter(obs => obs !== observer);
    };
  }

  // Clear all state (useful for logout/reset)
  clearState(): void {
    this.state = {
      username: null,
      sessionId: crypto.randomUUID(),
      channel: null,
      password: null,
      socket: null,
    };
    this.notifyObservers();
  }

  // Reset channel and password (for changing rooms)
  resetChannel(): void {
    this.state = {
      ...this.state,
      channel: null,
      password: null,
    };
    this.notifyObservers();
  }

  private notifyObservers(): void {
    this.observers.forEach(observer => observer(this.getState()));
  }
}

// Create singleton instance
export const chatStore = new ChatStore(); 