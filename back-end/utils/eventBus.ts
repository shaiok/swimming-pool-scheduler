// src/utils/eventBus.ts
type EventHandler = (data: any) => Promise<void>;

class EventBus {
  private handlers: Record<string, EventHandler[]> = {};
  
  public subscribe(event: string, handler: EventHandler): void {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(handler);
  }
  
  public async publish(event: string, data: any): Promise<void> {
    const eventHandlers = this.handlers[event] || [];
    await Promise.all(eventHandlers.map(handler => handler(data)));
  }
}

export const eventBus = new EventBus();