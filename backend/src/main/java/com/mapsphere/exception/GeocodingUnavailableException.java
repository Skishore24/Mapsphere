package com.mapsphere.exception;

public class GeocodingUnavailableException extends RuntimeException {
    public GeocodingUnavailableException(String message) {
        super(message);
    }
}
