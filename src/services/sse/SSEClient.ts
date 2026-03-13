type SSEHandler<T = unknown> = (data: T) => void;

interface SSEClientOptions {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Event) => void;
}

export class SSEClient {
  private url: string;
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<SSEHandler>> = new Map();
  private options: SSEClientOptions;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = false;

  constructor(url: string, options: SSEClientOptions = {}) {
    this.url = url;
    this.options = options;
  }

  connect(): void {
    this.shouldReconnect = true;
    this.createConnection();
  }

  private createConnection(): void {
    this.disconnect(false);

    this.eventSource = new EventSource(this.url);

    this.eventSource.onopen = () => {
      this.reconnectAttempts = 0;
      this.options.onConnected?.();
    };

    this.eventSource.onerror = (event) => {
      this.options.onError?.(event);
      this.options.onDisconnected?.();

      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }

      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    };

    // Re-attach all existing listeners to the new EventSource
    this.listeners.forEach((handlers, event) => {
      handlers.forEach((handler) => {
        this.eventSource!.addEventListener(event, ((e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            handler(data);
          } catch {
            // ignore malformed data
          }
        }) as EventListener);
      });
    });
  }

  private scheduleReconnect(): void {
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      if (this.shouldReconnect) {
        this.createConnection();
      }
    }, delay);
  }

  addEventListener<T = unknown>(event: string, handler: SSEHandler<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as SSEHandler);

    // If already connected, attach immediately
    if (this.eventSource) {
      this.eventSource.addEventListener(event, ((e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          (handler as SSEHandler)(data);
        } catch {
          // ignore malformed data
        }
      }) as EventListener);
    }
  }

  removeEventListener(event: string, handler: SSEHandler): void {
    this.listeners.get(event)?.delete(handler);
  }

  disconnect(permanent = true): void {
    if (permanent) {
      this.shouldReconnect = false;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (permanent) {
      this.listeners.clear();
      this.reconnectAttempts = 0;
    }
  }

  get isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}
