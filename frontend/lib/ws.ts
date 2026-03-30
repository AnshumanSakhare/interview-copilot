// WebSocket for bidirectional streaming with backend

export interface StreamMessage {
  type: 'transcript' | 'better_answer' | 'suggestion' | 'follow_ups' | 'error' | 'ready';
  content: string;
}

export class InterviewCopilotWS {
  private ws: WebSocket | null = null;
  private url: string;
  private onMessage: (msg: StreamMessage) => void = () => {};
  private onError: (error: string) => void = () => {};
  private onClose: () => void = () => {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;

  constructor(url: string) {
    this.url = url;
  }

  connect(
    onMessage: (msg: StreamMessage) => void,
    onError: (error: string) => void,
    onClose: () => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        let wsUrl = this.url.includes('://')
          ? this.url
          : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;

        // Guard against common env mistakes in deployed URLs.
        // Example: .../wss (wrong) should be .../ws (correct).
        wsUrl = wsUrl.replace(/\/wss$/i, '/ws');

        // If someone passes https/http URL by mistake, convert it to ws/wss.
        if (wsUrl.startsWith('https://')) {
          wsUrl = `wss://${wsUrl.slice('https://'.length)}`;
        } else if (wsUrl.startsWith('http://')) {
          wsUrl = `ws://${wsUrl.slice('http://'.length)}`;
        }

        this.ws = new WebSocket(wsUrl);
        this.onMessage = onMessage;
        this.onError = onError;
        this.onClose = onClose;

        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event: MessageEvent) => {
          try {
            const message: StreamMessage = JSON.parse(event.data);
            onMessage(message);
          } catch (e) {
            console.error('Failed to parse message:', e);
          }
        };

        this.ws.onerror = (_event: Event) => {
          const error = `WebSocket error occurred (${wsUrl})`;
          console.error(error);
          onError(error);
          reject(new Error(error));
        };

        this.ws.onclose = (event: CloseEvent) => {
          console.log(`WebSocket closed (code=${event.code}, reason=${event.reason || 'n/a'})`);
          onClose();
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  sendAudio(chunk: Uint8Array): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(chunk);
    }
  }

  sendControl(command: string): void {
    this.sendJson({ type: 'control', command });
  }

  sendJson(payload: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => {
        this.connect(this.onMessage, this.onError, this.onClose).catch(console.error);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }
}
