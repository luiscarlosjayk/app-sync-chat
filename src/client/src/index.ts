import './index.css';
import { logMessage, logObject } from './utils/log';
import { connectToEventApi, subscribeToChannel, sendEvent, unsubscribeFromChannel } from './utils/api';
import { Channel, ApiEvent, Message } from './types';

const HTTP_ENDPOINT = import.meta.env.VITE_HTTP_ENDPOINT;
const REALTIME_ENDPOINT = import.meta.env.VITE_REALTIME_ENDPOINT;
const API_KEY = import.meta.env.VITE_API_KEY;

const authorization: Record<string, string> = {
    'x-api-key': API_KEY,
    host: HTTP_ENDPOINT,
};

let username: string | null = null;
let sessionId: string = crypto.randomUUID();
let channel: Channel | null = null;
let password: string | null = null;
let socket: WebSocket | null = null;

const pageUsername = document.getElementById('page-username');
const pageChatRoomPicker = document.getElementById('page-chat-room-picker');
const pageChatRoom = document.getElementById('page-chat-room');
const usernameForm = pageUsername?.querySelector('form') as HTMLFormElement;
const privateChatRoomPickerForm = pageChatRoomPicker?.querySelector('form#private-chat-form') as HTMLFormElement;
const chatRoomMessageForm = pageChatRoom?.querySelector('form#chat-room-message-form') as HTMLFormElement;
const publicChatLink = pageChatRoomPicker?.querySelector('a[href="#public-chat"]') as HTMLAnchorElement;
const chatRoomBackButton = document.getElementById('chat-room-back-button') as HTMLAnchorElement;
const chatRoomPickerBackButton = document.getElementById('chat-room-picker-back-button') as HTMLAnchorElement;
const chatRoomTitle = pageChatRoom?.querySelector('#chat-room-title') as HTMLHeadingElement;
const chatRoomMessagesList = pageChatRoom?.querySelector('#chat-room-messages-list') as HTMLDivElement;

usernameForm.addEventListener('submit', (event) => {
    event.preventDefault();
    username = usernameForm.username.value;
    usernameForm.reset();
    pageUsername?.classList.add('hidden');
    pageChatRoomPicker?.classList.remove('hidden');

    logMessage(`Welcome ${username}`);
});

publicChatLink.addEventListener('click', (event) => {
    event.preventDefault();

    if (typeof username !== 'string') {
        logMessage('Please enter a username first');
        pageChatRoomPicker?.classList.add('hidden');
        pageUsername?.classList.remove('hidden');
        return;
    }

    channel = Channel.PUBLIC;
    pageChatRoomPicker?.classList.add('hidden');
    pageChatRoom?.classList.remove('hidden');
    chatRoomTitle.textContent = 'Public Chat';

    if (!socket) {
        logMessage('Failed to connect to event API');
        return;
    }

    subscribeToChannel({ socket, channel, authorization, id: sessionId });
    logMessage(`Subscribed to ${channel} channel`);
    
    chatRoomMessageForm.focus();
});

chatRoomBackButton.addEventListener('click', (event) => {
    event.preventDefault();
    pageChatRoom?.classList.add('hidden');
    pageChatRoomPicker?.classList.remove('hidden');

    if (socket && channel && username) {
        logMessage(`Unsubscribing from ${channel} channel`);
        unsubscribeFromChannel({ socket, channel, authorization, id: sessionId });
    }

    channel = null;
    password = null;
});

chatRoomPickerBackButton.addEventListener('click', (event) => {
    event.preventDefault();
    pageChatRoomPicker?.classList.add('hidden');
    pageUsername?.classList.remove('hidden');

    if (socket && channel && username) {
        logMessage(`Unsubscribing from ${channel} channel`);
        unsubscribeFromChannel({ socket, channel, authorization, id: sessionId });
    }

    channel = null;
    password = null;
    username = null;
});

privateChatRoomPickerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (typeof username !== 'string') {
        logMessage('Please enter a username first');
        pageChatRoomPicker?.classList.add('hidden');
        pageUsername?.classList.remove('hidden');
        return;
    }

    channel = Channel.PRIVATE;
    password = privateChatRoomPickerForm.password.value;
    privateChatRoomPickerForm.reset();
    pageChatRoomPicker?.classList.add('hidden');
    pageChatRoom?.classList.remove('hidden');
    chatRoomTitle.textContent = 'Private Chat';

    if (!socket) {
        logMessage('Failed to connect to event API');
        return;
    }

    const authorizationWithPassword = {
        ...authorization,
        ...(channel === Channel.PRIVATE && password ? { 'Authorization': password } : {}),
    };
    subscribeToChannel({ socket, channel, authorization: authorizationWithPassword, id: username });
    logMessage(`Subscribed to ${channel} channel`);

    chatRoomMessageForm.focus();
});

chatRoomMessageForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (typeof username !== 'string') {
        logMessage('Please enter a username first');
        pageChatRoom?.classList.add('hidden');
        pageUsername?.classList.remove('hidden');
        return;
    }

    if (channel === null) {
        logMessage('Please select a channel first');
        pageChatRoom?.classList.add('hidden');
        pageChatRoomPicker?.classList.remove('hidden');
        return;
    }

    if (channel === Channel.PRIVATE && !password) {
        logMessage('Please enter a password first');
        pageChatRoom?.classList.add('hidden');
        pageChatRoomPicker?.classList.remove('hidden');
        return;
    }
    const message = chatRoomMessageForm.message.value;
    chatRoomMessageForm.reset();
    logMessage(`Sending message through session ${sessionId}: ${message}`);

    logMessage(channel);
    logObject({
        ...authorization,
        ...(channel === Channel.PRIVATE && password ? { 'Authorization': password } : {}),
    });

    const authorizationWithPassword = {
        ...authorization,
        ...(channel === Channel.PRIVATE && password ? { 'Authorization': password } : {}),
    };

    sendEvent({
        event: {
            message,
            username,
        },
        channel,
        httpDomain: HTTP_ENDPOINT,
        authorization: authorizationWithPassword,
    });
});

// Init
pageUsername?.classList.remove('hidden');
socket = await connectToEventApi({ realtimeDomain: REALTIME_ENDPOINT, authorization, onMessage });

function onMessage(event: MessageEvent) {
    const data = JSON.parse(event.data) as ApiEvent;

    logObject(data, 'Data');
    if (data.type === 'data') {
        const message = JSON.parse(data.event) as Message;
        logObject(message, 'Message');

        if (message.username === username) {
            ownMessage(message.message, message.timestamp);
        } else {
            otherMessage(message.username, message.message, message.timestamp);
        }
    }
}

function ownMessage(message: string, timestamp: string) {
    const ownMessageHtml = `
        <div class="flex items-start gap-2.5 justify-end">
            <div class="flex flex-col w-full max-w-[320px] leading-1.5 p-4 bg-gray-800 rounded-s-xl rounded-br-xl">
            <div class="flex items-center space-x-2 rtl:space-x-reverse">
                <span class="text-sm font-semibold text-white">${username}</span>
                ${timestamp ? `<span class="text-sm font-normal text-gray-300">${timestamp}</span>` : ''}
                </div>
                <p class="text-sm font-normal py-2.5 text-white">${message}</p>
            </div>
            <svg class="w-6 h-6 text-gray-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-width="2" d="M7 17v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1a3 3 0 0 0-3-3h-4a3 3 0 0 0-3 3Zm8-9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
            </svg>
        </div>
    `;
    const messageElement = document.createElement('div');
    messageElement.innerHTML = ownMessageHtml;
    chatRoomMessagesList.appendChild(messageElement);
}

function otherMessage(username: string, message: string, timestamp: string) {
    const otherMessageHtml = `
        <div class="flex items-start justify-start gap-2.5">
            <svg class="w-6 h-6 text-gray-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-width="2" d="M7 17v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1a3 3 0 0 0-3-3h-4a3 3 0 0 0-3 3Zm8-9a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
            </svg>              
            <div class="flex flex-col w-full max-w-[320px] leading-1.5 p-4 bg-gray-500 rounded-e-xl rounded-es-xl">
                <div class="flex items-center space-x-2 rtl:space-x-reverse">
                <span class="text-sm font-semibold text-white">${username}</span>
                ${timestamp ? `<span class="text-sm font-normal text-gray-300">${timestamp}</span>` : ''}
                </div>
                <p class="text-sm font-normal py-2.5 text-white">${message}</p>
            </div>
        </div>
    `;

    const messageElement = document.createElement('div');
    messageElement.innerHTML = otherMessageHtml;
    chatRoomMessagesList.appendChild(messageElement);
}
