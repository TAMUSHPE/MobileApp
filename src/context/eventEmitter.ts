type EventListener = (data?: any) => void;

class SimpleEventEmitter {
    private events: Record<string, EventListener[]>;

    constructor() {
        this.events = {};
    }

    on(event: string, listener: EventListener): void {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    off(event: string, listener: EventListener): void {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(l => l !== listener);
        }
    }

    emit(event: string, data?: any): void {
        if (this.events[event]) {
            this.events[event].forEach(listener => listener(data));
        }
    }
}

export const eventEmitter = new SimpleEventEmitter();
