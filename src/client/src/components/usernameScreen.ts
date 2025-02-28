import { chatStore } from '../store/chatStore';
import { logMessage } from '../utils/log';

export class UsernameScreen {
  private element: HTMLElement | null;
  private form: HTMLFormElement | null;
  private onComplete: () => void;

  constructor(onComplete: () => void) {
    this.element = document.getElementById('page-username');
    this.form = this.element?.querySelector('form') as HTMLFormElement;
    this.onComplete = onComplete;
    this.init();
  }

  init(): void {
    if (!this.form) {
      console.error('Username form not found');
      return;
    }

    this.form.addEventListener('submit', this.handleSubmit.bind(this));
  }

  private handleSubmit(event: Event): void {
    event.preventDefault();
    
    if (!this.form) return;
    
    const username = this.form.username.value;
    chatStore.setState({ username });
    
    this.form.reset();
    this.hide();
    
    logMessage(`Welcome ${username}`);
    this.onComplete();
  }

  show(): void {
    this.element?.classList.remove('hidden');
  }

  hide(): void {
    this.element?.classList.add('hidden');
  }
} 