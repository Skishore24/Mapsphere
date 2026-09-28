import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { LocationMessage } from '../types';

export function useWebSocket(shareId?: string | null, onLocationReceived?: (msg: LocationMessage) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!shareId) {
      setIsConnected(false);
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8081/ws-mapsphere'),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
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
