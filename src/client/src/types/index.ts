export enum Channel {
    PUBLIC = '/public-chat',
    PRIVATE = '/private-chat',
}

export interface ApiEvent {
    type: 'connection_ack' | 'ka' | 'data' | 'unsubscribe_error' | 'subscribe_error' | 'subscribe_success';
    event: string;
    connectionTimeoutMs?: number;
    errors?: Array<{ errorType: string }>;
}

export interface Message {
    username: string;
    message: string;
    timestamp: string;
}