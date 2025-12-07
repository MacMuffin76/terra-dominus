import ws from 'k6/ws';
import { sleep } from 'k6';
import { Counter } from 'k6/metrics';

const WS_BASE_URL = __ENV.WS_BASE_URL || 'ws://localhost:5000';
const token = (__ENV.AUTH_TOKEN || '').trim();
const roomSuffix = __ENV.ROOM_SUFFIX || '';
const pingInterval = Number(__ENV.PING_INTERVAL_MS || 15000);

const joins = new Counter('socket_joins');
const leaves = new Counter('socket_leaves');

export const options = {
  vus: 200,
  duration: '5m',
};

export default function () {
  const url = `${WS_BASE_URL}/socket.io/?EIO=4&transport=websocket`;
  const params = {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };

  ws.connect(url, params, (socket) => {
    let connected = false;

    socket.on('open', () => {
      // Etape 1 : handshake Socket.IO
      socket.send('40');
    });

    socket.on('message', (data) => {
      // Socket.IO messages v4 : 40 = connect, 42 = event
      if (typeof data === 'string' && data.startsWith('40')) {
        connected = true;
        joins.add(1);

        // Joindre la room utilisateur
        socket.send(`42["user_connected",{}]`);

        if (roomSuffix) {
          socket.send(`42["join_room",{"room":"${roomSuffix}"}]`);
        }

        // Simuler un update combat/récolte
        socket.send('42["combat_update",{"status":"sync"}]');
      }

      // Répondre aux pings serveur pour garder la connexion ouverte
      if (data === '2') {
        socket.send('3');
      }
    });

    socket.setInterval(() => {
      socket.send('2');
    }, pingInterval);

    socket.on('close', () => {
      if (connected) {
        leaves.add(1);
      }
    });

    socket.on('error', () => {
      socket.close();
    });

    sleep(5);
    socket.close();
  });
}