const REALTIME_DOMAIN = ''
const HTTP_DOMAIN = ''
const API_KEY = ''

const publicChatNameSpaces = 'public-chat';
const authorization = { 'x-api-key': API_KEY, host: HTTP_DOMAIN }

function getAuthProtocol() {
  const header = btoa(JSON.stringify(authorization))
    .replace(/\+/g, '-') // Convert '+' to '-'
    .replace(/\//g, '_') // Convert '/' to '_'
    .replace(/=+$/, '') // Remove padding `=`
  return `header-${header}`
}

const socketA = await new Promise<WebSocket>((resolve, reject) => {
  const socket = new WebSocket(
    `wss://${REALTIME_DOMAIN}/event/realtime`,
    ['aws-appsync-event-ws', getAuthProtocol()])
  socket.onopen = () => {
    socket.send(JSON.stringify({ type: 'connection_init' }))
    resolve(socket)
  }
  socket.onclose = (evt) => reject(new Error(evt.reason))
  socket.onmessage = (event) => console.log('teamA =>', event)
});

socketA.send(JSON.stringify({
  type: 'subscribe',
  id: crypto.randomUUID(),
  channel: `/${privateChatNameSpaces}/teamA`,
  authorization
}));

const socketB = await new Promise<WebSocket>((resolve, reject) => {
  const socket = new WebSocket(
    `wss://${REALTIME_DOMAIN}/event/realtime`,
    ['aws-appsync-event-ws', getAuthProtocol()])
  socket.onopen = () => {
    socket.send(JSON.stringify({ type: 'connection_init' }))
    resolve(socket)
  }
  socket.onclose = (evt) => reject(new Error(evt.reason))
  socket.onmessage = (event) => console.log('teamB =>', event)
});

socketB.send(JSON.stringify({
  type: 'subscribe',
  id: crypto.randomUUID(),
  channel: `/${privateChatNameSpaces}/teamB`,
  authorization
}));

document.getElementById('start-button')?.addEventListener('click', async () => {
  const event = {
    channel: `/${publicChatNameSpaces}/hola`,
    events: [
        JSON.stringify({
            message: 'Hello World',
        }),
        JSON.stringify({
            probando: 'Hola mundo',
        }),
    ]
  };
  
  await fetch(`https://${HTTP_DOMAIN}/event`, {
    method: 'POST',
    headers: authorization,
    body: JSON.stringify(event)
  })
  .then(response => response.json())
  .then(data => {
    logObject(data, 'response');
  });
});