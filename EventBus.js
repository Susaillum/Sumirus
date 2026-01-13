class EventBus {
    constructor() {
        this.listeners = {};
    }

    // Alguém se inscreve para ouvir um evento
    subscribe(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    // Alguém grita o evento (ex: Clicou em Salvar!)
    publish(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        } else {
            console.warn(`[EventBus] Ninguém ouviu o evento: ${event}`);
        }
    }
}

export const bus = new EventBus();