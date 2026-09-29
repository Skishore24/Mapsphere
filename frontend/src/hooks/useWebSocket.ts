import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { LocationMessage } from '../types';

const rawWs = import.meta.env.VITE_WS_URL || (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/ws-mapsphere` : 'http://localhost:8081/ws-mapsphere');
const WS_ENDPOINT = rawWs.endsWith('/ws-mapsphere') ? rawWs : `${rawWs}/ws-mapsphere`;

export function useWebSocket(shareId?: string | null, onLocationReceived?: (msg: LocationMessage) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!shareId) {
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_ENDPOINT),
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setIsConnected(true);
        if (onLocationReceived) {
          client.subscribe(`/topic/location/${shareId}`, message => {
            try {
              const parsed: LocationMessage = JSON.parse(message.body);
              onLocationReceived(parsed);
            } catch (err) {
              console.error('Error parsing live location message', err);
            }
          });
        }
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onStompError: frame => {
        console.error('STOMP Broker error: ' + frame.headers['message']);
      },
      onWebSocketError: event => {
        console.warn('STOMP WebSocket warning:', event);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [shareId, onLocationReceived]);

  const sendLocationUpdate = useCallback((msg: LocationMessage) => {
    if (clientRef.current && clientRef.current.connected) {
      clientRef.current.publish({
        destination: '/app/location.update',
        body: JSON.stringify(msg),
      });
    }
  }, []);

  return { isConnected, sendLocationUpdate };
}
