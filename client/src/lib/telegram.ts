declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            photo_url?: string;
          };
          start_param?: string;
        };
        colorScheme: 'light' | 'dark';
        themeParams: Record<string, string>;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show(): void;
          hide(): void;
          enable(): void;
          disable(): void;
          setText(text: string): void;
          onClick(callback: () => void): void;
          offClick(callback: () => void): void;
        };
        BackButton: {
          isVisible: boolean;
          show(): void;
          hide(): void;
          onClick(callback: () => void): void;
          offClick(callback: () => void): void;
        };
        HapticFeedback: {
          impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
          notificationOccurred(type: 'error' | 'success' | 'warning'): void;
          selectionChanged(): void;
        };
        expand(): void;
        close(): void;
        ready(): void;
        sendData(data: string): void;
        openLink(url: string): void;
        openTelegramLink(url: string): void;
        showPopup(params: {
          title?: string;
          message: string;
          buttons?: Array<{
            id?: string;
            type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
            text: string;
          }>;
        }): void;
      };
    };
  }
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export class TelegramWebApp {
  private static instance: TelegramWebApp;
  private webapp: typeof window.Telegram.WebApp | null = null;

  private constructor() {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      this.webapp = window.Telegram.WebApp;
      this.webapp.ready();
      this.webapp.expand();
    }
  }

  static getInstance(): TelegramWebApp {
    if (!TelegramWebApp.instance) {
      TelegramWebApp.instance = new TelegramWebApp();
    }
    return TelegramWebApp.instance;
  }

  isAvailable(): boolean {
    return this.webapp !== null;
  }

  getUser(): TelegramUser | null {
    return this.webapp?.initDataUnsafe?.user || null;
  }

  getStartParam(): string | null {
    return this.webapp?.initDataUnsafe?.start_param || null;
  }

  getColorScheme(): 'light' | 'dark' {
    return this.webapp?.colorScheme || 'light';
  }

  showMainButton(text: string, callback: () => void): void {
    if (this.webapp?.MainButton) {
      this.webapp.MainButton.setText(text);
      this.webapp.MainButton.onClick(callback);
      this.webapp.MainButton.show();
    }
  }

  hideMainButton(): void {
    if (this.webapp?.MainButton) {
      this.webapp.MainButton.hide();
    }
  }

  showBackButton(callback: () => void): void {
    if (this.webapp?.BackButton) {
      this.webapp.BackButton.onClick(callback);
      this.webapp.BackButton.show();
    }
  }

  hideBackButton(): void {
    if (this.webapp?.BackButton) {
      this.webapp.BackButton.hide();
    }
  }

  hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection'): void {
    if (this.webapp?.HapticFeedback) {
      if (type === 'success' || type === 'error' || type === 'warning') {
        this.webapp.HapticFeedback.notificationOccurred(type);
      } else if (type === 'selection') {
        this.webapp.HapticFeedback.selectionChanged();
      } else {
        this.webapp.HapticFeedback.impactOccurred(type);
      }
    }
  }

  openLink(url: string): void {
    if (this.webapp) {
      this.webapp.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  }

  openTelegramLink(url: string): void {
    if (this.webapp) {
      this.webapp.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  }

  showPopup(title: string, message: string, buttons?: Array<{ text: string; type?: string }>): void {
    if (this.webapp) {
      this.webapp.showPopup({
        title,
        message,
        buttons: buttons || [{ text: 'OK', type: 'ok' }]
      });
    } else {
      alert(`${title}\n\n${message}`);
    }
  }

  close(): void {
    if (this.webapp) {
      this.webapp.close();
    }
  }
}

export const telegram = TelegramWebApp.getInstance();
