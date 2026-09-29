package com.mapsphere;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.BufferedReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@SpringBootApplication
public class MapSphereApplication {

	static {
		loadDotEnv();
		normalizeRenderDatabaseUrl();
	}

	public static void main(String[] args) {
		SpringApplication.run(MapSphereApplication.class, args);
	}

	private static void normalizeRenderDatabaseUrl() {
		String rawUrl = System.getenv("DATABASE_URL");
		if (rawUrl == null || rawUrl.isBlank()) {
			rawUrl = System.getProperty("DATABASE_URL");
		}
		if (rawUrl == null || rawUrl.isBlank()) {
			rawUrl = System.getenv("DB_URL");
		}

		if (rawUrl != null && (rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://"))) {
			try {
				// Normalize postgres:// to standard URI
				String uriString = rawUrl.replaceFirst("^postgres://", "postgresql://");
				java.net.URI uri = new java.net.URI(uriString);
				String host = uri.getHost();
				int port = uri.getPort() == -1 ? 5432 : uri.getPort();
				String path = uri.getPath();
				String query = uri.getQuery();

				String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path + (query != null ? "?" + query : "");
				System.setProperty("DB_URL", jdbcUrl);

				if (uri.getUserInfo() != null && uri.getUserInfo().contains(":")) {
					String[] userPass = uri.getUserInfo().split(":", 2);
					System.setProperty("DB_USERNAME", userPass[0]);
					System.setProperty("DB_PASSWORD", userPass[1]);
				}
			} catch (Exception ignored) {
			}
		}
	}

	private static void loadDotEnv() {
		Path[] searchPaths = new Path[]{
				Paths.get(".env"),
				Paths.get("../.env"),
				Paths.get("backend/.env")
		};

		for (Path path : searchPaths) {
			if (Files.exists(path) && !Files.isDirectory(path)) {
				try (BufferedReader reader = Files.newBufferedReader(path)) {
					String line;
					while ((line = reader.readLine()) != null) {
						line = line.trim();
						if (line.isEmpty() || line.startsWith("#")) continue;
						int eqIdx = line.indexOf('=');
						if (eqIdx > 0) {
							String key = line.substring(0, eqIdx).trim();
							String value = line.substring(eqIdx + 1).trim();
							if ((value.startsWith("\"") && value.endsWith("\"")) ||
									(value.startsWith("'") && value.endsWith("'"))) {
								value = value.substring(1, value.length() - 1);
							}
							if (System.getProperty(key) == null && System.getenv(key) == null) {
								System.setProperty(key, value);
							}
						}
					}
				} catch (Exception ignored) {
				}
				break;
			}
		}
	}
}
