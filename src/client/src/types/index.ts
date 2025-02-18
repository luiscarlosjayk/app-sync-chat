export enum Channel {
    PUBLIC = '/public-chat',
    PRIVATE = '/private-chat',
}

export interface ApiEvent {
    type: 'connection_ack' | 'ka' | 'data' | 'unsubscribe_error';
    event: string;
    connectionTimeoutMs?: number;
}

export interface Message {
    username: string;
    message: string;
    timestamp: string;
}