import { ChatService } from '../services/chatService';
import { chatStore } from '../store/chatStore';
import { logMessage } from '../utils/log';

export class ChatRoom {
  private element: HTMLElement | null;
  private titleElement: HTMLHeadingElement | null;
  private messagesList: HTMLDivElement | null;
  private messageForm: HTMLFormElement | null;
  private backButton: HTMLAnchorElement | null;
  private chatService: ChatService;
  private onBackClicked: () => void;

  constructor(chatService: ChatService, onBackClicked: () => void) {
    this.element = document.getElementById('page-chat-room');
    this.titleElement = this.element?.querySelector('#chat-room-title') as HTMLHeadingElement;
    this.messagesList = this.element?.querySelector('#chat-room-messages-list') as HTMLDivElement;
    this.messageForm = this.element?.querySelector('form#chat-room-message-form') as HTMLFormElement;
    this.backButton = document.getElementById('chat-room-back-button') as HTMLAnchorElement;
    
    this.chatService = chatService;
    this.onBackClicked = onBackClicked;
    
    this.init();
  }

  init(): void {
    if (this.messageForm) {
      this.messageForm.addEventListener('submit', this.handleMessageSubmit.bind(this));
    }
    
    if (this.backButton) {
      this.backButton.addEventListener('click', this.handleBackClick.bind(this));
    }
  }

  setup(): void {
    const { channel, password } = chatStore.getState();
    
    if (!channel) {
      logMessage('No channel selected');
      return;
    }
    
    // Set the title based on the channel
    if (this.titleElement) {
      this.titleElement.textContent = channel === '/public-chat' ? 'Public Chat' : 'Private Chat';
    }
    
    // Clear messages from previous sessions
    this.clearMessages();
    
    // Subscribe to the channel
    this.chatService.subscribeToChannel(channel, password || undefined);
    
    // Focus the message input
    if (this.messageForm) {
      this.messageForm.focus();
    }
  }

  private handleMessageSubmit(event: Event): void {
    event.preventDefault();
    
    if (!this.messageForm) return;
    
    const { username, channel, password } = chatStore.getState();
    
    if (!username) {
      logMessage('Please enter a username first');
      this.hide();
      this.onBackClicked();
      return;
    }
    
    if (!channel) {
      logMessage('Please select a channel first');
      this.hide();
      this.onBackClicked();
      return;
    }
    
    if (channel === '/private-chat' && !password) {
      logMessage('Please enter a password first');
      this.hide();
      this.onBackClicked();
      return;
    }
    
    const message = this.messageForm.message.value;
    if (!message.trim()) return;
    
    this.chatService.sendMessage(message);
    this.messageForm.reset();
  }

  private handleBackClick(event: Event): void {
    event.preventDefault();
    
    // Unsubscribe from the current channel
    this.chatService.unsubscribeFromChannel();
    
    // Reset channel data
    chatStore.resetChannel();
    
    this.hide();
    this.onBackClicked();
  }
  
  // Helper to render an own message
  renderOwnMessage(username: string, message: string, timestamp?: string, className?: string): void {
    if (!this.messagesList) return;
    
    const ownMessageHtml = `
      <div class="flex items-start gap-2.5 justify-end ${className || ''}">
          <div class="flex flex-col w-full max-w-[320px] leading-1.5 p-4 bg-gray-800 rounded-s-xl rounded-br-xl">
          <div class="flex items-center space-x-2 rtl:space-x-reverse">
              <span class="text-sm font-semibold text-white">${username}</span>
              ${timestamp ? `<span class="text-sm font-normal text-gray-300">${timestamp}</span>` : ''}
              </div>
              <p class="text-sm font-normal py-2.5 text-white">${message}</p>
          </div>
          <svg class="w-6 h-6 text-gray-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-width="2" d="M7 17v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1a3 3 0 0 0-3-3h-4a3 3 0 0 0-3 3Zm8-9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
          </svg>
      </div>
    `;
    
    const messageElement = document.createElement('div');
    messageElement.innerHTML = ownMessageHtml;
    this.messagesList.appendChild(messageElement);
    this.scrollToBottom();
  }
  
  // Helper to render a message from another user
  renderOtherMessage(username: string, message: string, timestamp?: string, className?: string): void {
    if (!this.messagesList) return;
    
    const otherMessageHtml = `
      <div class="flex items-start justify-start gap-2.5 ${className || ''}">
          <svg class="w-6 h-6 text-gray-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-width="2" d="M7 17v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1a3 3 0 0 0-3-3h-4a3 3 0 0 0-3 3Zm8-9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
          </svg>              
          <div class="flex flex-col w-full max-w-[320px] leading-1.5 p-4 bg-gray-500 rounded-e-xl rounded-es-xl">
              <div class="flex items-center space-x-2 rtl:space-x-reverse">
              <span class="text-sm font-semibold text-white">${username}</span>
              ${timestamp ? `<span class="text-sm font-normal text-gray-300">${timestamp}</span>` : ''}
              </div>
              <p class="text-sm font-normal py-2.5 text-white">${message}</p>
          </div>
      </div>
    `;
    
    const messageElement = document.createElement('div');
    messageElement.innerHTML = otherMessageHtml;
    this.messagesList.appendChild(messageElement);
    this.scrollToBottom();
  }
  
  // Clear the messages list
  clearMessages(): void {
    if (this.messagesList) {
      this.messagesList.innerHTML = '';
    }
  }
  
  // Scroll to the bottom of the messages list
  private scrollToBottom(): void {
    if (this.messagesList) {
      this.messagesList.scrollTop = this.messagesList.scrollHeight;
    }
  }

  show(): void {
    this.element?.classList.remove('hidden');
  }

  hide(): void {
    this.element?.classList.add('hidden');
  }
} 