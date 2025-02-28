import { chatStore } from '../store/chatStore';
import { Channel } from '../types';
import { logMessage } from '../utils/log';

export class ChatRoomPicker {
  private element: HTMLElement | null;
  private privateChatForm: HTMLFormElement | null;
  private publicChatLink: HTMLAnchorElement | null;
  private backButton: HTMLAnchorElement | null;
  private onPublicChatSelected: () => void;
  private onPrivateChatSelected: () => void;
  private onBackClicked: () => void;

  constructor(
    onPublicChatSelected: () => void,
    onPrivateChatSelected: () => void,
    onBackClicked: () => void
  ) {
    this.element = document.getElementById('page-chat-room-picker');
    this.privateChatForm = this.element?.querySelector('form#private-chat-form') as HTMLFormElement;
    this.publicChatLink = this.element?.querySelector('a[href="#public-chat"]') as HTMLAnchorElement;
    this.backButton = document.getElementById('chat-room-picker-back-button') as HTMLAnchorElement;
    
    this.onPublicChatSelected = onPublicChatSelected;
    this.onPrivateChatSelected = onPrivateChatSelected;
    this.onBackClicked = onBackClicked;
    
    this.init();
  }

  init(): void {
    if (this.publicChatLink) {
      this.publicChatLink.addEventListener('click', this.handlePublicChatClick.bind(this));
    }
    
    if (this.privateChatForm) {
      this.privateChatForm.addEventListener('submit', this.handlePrivateChatSubmit.bind(this));
    }
    
    if (this.backButton) {
      this.backButton.addEventListener('click', this.handleBackClick.bind(this));
    }
  }

  private handlePublicChatClick(event: Event): void {
    event.preventDefault();
    
    const { username } = chatStore.getState();
    
    if (typeof username !== 'string') {
      logMessage('Please enter a username first');
      this.hide();
      this.onBackClicked();
      return;
    }
    
    chatStore.setState({ channel: Channel.PUBLIC });
    this.hide();
    this.onPublicChatSelected();
  }

  private handlePrivateChatSubmit(event: Event): void {
    event.preventDefault();
    
    if (!this.privateChatForm) return;
    
    const { username } = chatStore.getState();
    
    if (typeof username !== 'string') {
      logMessage('Please enter a username first');
      this.hide();
      this.onBackClicked();
      return;
    }
    
    const password = this.privateChatForm.password.value;
    chatStore.setState({ 
      channel: Channel.PRIVATE,
      password
    });
    
    this.privateChatForm.reset();
    this.hide();
    this.onPrivateChatSelected();
  }

  private handleBackClick(event: Event): void {
    event.preventDefault();
    chatStore.setState({ username: null });
    this.hide();
    this.onBackClicked();
  }

  show(): void {
    this.element?.classList.remove('hidden');
  }

  hide(): void {
    this.element?.classList.add('hidden');
  }
} 