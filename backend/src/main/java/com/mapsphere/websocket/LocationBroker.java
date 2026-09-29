package com.mapsphere.websocket;

public interface LocationBroker {
    void broadcastLocation(String shareId, LocationMessage message);
}
