/**
 * References:
 * - https://aws.amazon.com/blogs/mobile/announcing-aws-appsync-events-serverless-websocket-apis/
 */
import { getAuthProtocol } from './authorization'
import { logObject } from './log'

export async function connectToEventApi(
    props: {
        realtimeDomain: string,
        authorization: Parameters<typeof getAuthProtocol>[0],
        onMessage: (event: MessageEvent) => void,
        onError?: (event: Event) => void,
    }
): Promise<WebSocket> {
    const {realtimeDomain, authorization, onMessage, onError} = props;

    return new Promise((resolve, reject) => {
        const socket = new WebSocket(
            `wss://${realtimeDomain}/event/realtime`,
            ['aws-appsync-event-ws', getAuthProtocol(authorization)]
        );
        
        socket.onopen = () => {
          socket.send(JSON.stringify({ type: 'connection_init' }));
          resolve(socket);
        };
        onError && (socket.onerror = (event) => onError(event));
        socket.onclose = (event) => reject(new Error(event.reason));
        socket.onmessage = onMessage;
    });
}

export function subscribeToChannel(
    props: {
        socket: WebSocket,
        id?: string,
        channel: string,
        authorization: Parameters<typeof getAuthProtocol>[0],
    }
): void {
    const {socket, id = crypto.randomUUID(), channel, authorization} = props;
    logObject(authorization, 'Authorization');

    socket.send(JSON.stringify({
        type: 'subscribe',
        id,
        channel,
        authorization: authorization,
    }));
}

export function unsubscribeFromChannel(
    props: {
        socket: WebSocket,
        id: string,
        channel: string,
        authorization: Parameters<typeof getAuthProtocol>[0],
    }
): void {
    const {socket, id, channel, authorization} = props;

    socket.send(JSON.stringify({
        type: 'unsubscribe',
        id,
        channel,
        authorization: authorization,
    }));
}

export async function sendEvent(
    props: {
        event: Record<string, string>,
        channel: string,
        httpDomain: string,
        authorization: Parameters<typeof getAuthProtocol>[0],
    }
): Promise<Response> {
    const {event, channel, httpDomain, authorization} = props;

    const payload = {
        channel,
        events: [
            JSON.stringify(event)
        ],
    };

    return fetch(`https://${httpDomain}/event`, {
        method: 'POST',
        headers: authorization,
        body: JSON.stringify(payload),
    });
}
