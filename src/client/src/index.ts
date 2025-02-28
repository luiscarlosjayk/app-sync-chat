import { ChatRoom } from './components/chatRoom';
import { ChatRoomPicker } from './components/chatRoomPicker';
import { UsernameScreen } from './components/usernameScreen';
import './index.css';
import { ChatService } from './services/chatService';
import { chatStore } from './store/chatStore';

// Initialize the application
async function initApp() {
  // Create chat room instance
  const chatRoom = new ChatRoom(
    // Create chat service with message handlers
    new ChatService(
      // Own message handler
      (username, message, timestamp, className) => {
        chatRoom.renderOwnMessage(username, message, timestamp, className);
      },
      // Other user message handler
      (username, message, timestamp, className) => {
        chatRoom.renderOtherMessage(username, message, timestamp, className);
      },
      // Server message handler
      (username, message, timestamp, className) => {
        chatRoom.renderOtherMessage(username, message, timestamp, className);
      }
    ),
    // Back button handler
    () => chatRoomPicker.show()
  );

  // Create chat room picker instance
  const chatRoomPicker = new ChatRoomPicker(
    // Public chat handler
    () => {
      chatRoom.show();
      chatRoom.setup();
    },
    // Private chat handler
    () => {
      chatRoom.show();
      chatRoom.setup();
    },
    // Back button handler
    () => usernameScreen.show()
  );

  // Create username screen instance
  const usernameScreen = new UsernameScreen(
    // Complete handler
    () => chatRoomPicker.show()
  );

  // Initialize the chat service connection
  const chatService = new ChatService(
    (username, message, timestamp, className) => {
      chatRoom.renderOwnMessage(username, message, timestamp, className);
    },
    (username, message, timestamp, className) => {
      chatRoom.renderOtherMessage(username, message, timestamp, className);
    },
    (username, message, timestamp, className) => {
      chatRoom.renderOtherMessage(username, message, timestamp, className);
    }
  );
  
  await chatService.connect();

  // Store the socket in state
  const { socket } = chatStore.getState();
  if (!socket) {
    console.error('Failed to connect to event API');
    return;
  }

  // Start with the username screen
  usernameScreen.show();
}

// Start the application
initApp().catch(console.error);
