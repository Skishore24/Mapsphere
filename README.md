# 🌍 MapSphere — Real-Time Geospatial & Navigation Platform

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen?logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-purple?logo=vite)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PostGIS-336791?logo=postgresql)](https://postgis.net/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?logo=leaflet)](https://leafletjs.com/)
[![WebSockets](https://img.shields.io/badge/STOMP-WebSockets-orange)](https://stomp.github.io/)

MapSphere is a full-stack, enterprise-grade geospatial mapping and real-time navigation web application. It combines interactive mapping with **PostGIS spatial indexing**, **Nominatim geocoding**, **OSRM routing**, **live bi-directional WebSocket location streaming**, and a **JWT-secured admin & user portal**.

---

## 📑 Table of Contents

- [Features](#-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [System Prerequisites](#-system-prerequisites)
- [Database Setup (PostgreSQL + PostGIS)](#-database-setup-postgresql--postgis)
- [Step-by-Step Guide to Run the App](#-step-by-step-guide-to-run-the-app)
  - [1. Backend Startup](#1-run-the-backend-spring-boot)
  - [2. Frontend Startup](#2-run-the-frontend-react--vite)
- [Default Credentials & Initial Seed Data](#-default-credentials--initial-seed-data)
- [Live Location Sharing Workflow](#-live-location-sharing-workflow)
- [API Endpoints Reference](#-api-endpoints-reference)
- [Project Directory Structure](#-project-directory-structure)
- [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🚀 Features

### 🗺️ Interactive Geospatial Mapping
- **Interactive Leaflet Map**: Smooth zoom, panning, custom high-contrast SVG markers, and intuitive popups with place details.
- **Dynamic Bounding-Box Loading**: Fetches places dynamically as the map viewport moves and zooms, preventing memory overload.
- **Spatial Marker Clustering**: Grid-based clustering collapses dense clusters at low zoom levels (< 14) and reveals individual vector pins with bounds-zoom upon click.
- **High-Performance Basemap Switcher**: Switch on-the-fly between **Esri Streets** (Akamai Edge CDN <60ms cached), **Esri Satellite**, **OpenStreetMap Standard**, and **World Topographic**.
- **Category Filter Bar**: Filter points of interest instantly (Restaurants, Hotels, Hospitals, Colleges, Parks, Petrol Stations / EV Chargers, Banks, Pharmacies, Shops).
- **Reverse Geocoding on Click**: Click anywhere on the map to retrieve human-readable address information and coordinates.

### 🔍 Search & Geocoding
- **Smart Autocomplete**: Powered by OpenStreetMap Nominatim with debounced search suggestions.
- **Categorized Results**: Rapidly discover nearby amenities with calculated distance from your location.
- **Search History Recall**: Automatically logs user queries for rapid recall; clicking past queries auto-fills and triggers instant search.

### 🛣️ Turn-by-Turn Routing & Directions
- **Multi-Modal Routing**: Supports **Driving (Car)**, **Walking (Foot)**, and **Cycling (Bicycle)** modes using the OSRM routing engine.
- **Interactive Waypoints**: Pick start and destination via search autocomplete, current GPS position, or map click.
- **Detailed Navigation Panel**: Turn-by-turn guidance maneuvers, total distance (km), estimated travel time (min/hr), and route history tracking.

### 🧭 Real-Time Turn-by-Turn Navigation HUD
- **Head-Up Display (HUD)**: Fullscreen navigation overlay with prominent maneuver directions (left/right turns, roundabouts, U-turns, continue, arrive).
- **Real-Time Step Progression**: Automatically advances to the next maneuver step as the user approaches within 20 meters.
- **Automatic Off-Route Detection**: Continuously monitors GPS proximity to the route geometry. If distance exceeds 40m for 3 consecutive GPS fixes, the system automatically marks the trip as `OFF_ROUTE`.
- **Dynamic Rerouting**: Automatically calculates a fresh optimal road route from current GPS coordinates to destination with a 10-second stabilization cooldown.
- **Arrival Detection**: Notifies the user upon reaching within 25 meters of the destination.

### 📡 Real-Time Live Location Sharing
- **Bi-Directional STOMP over WebSockets**: Stream GPS telemetry (`latitude`, `longitude`, `heading`, `speed`, `accuracy`) in real time.
- **Sharable Tracking Link**: Generate unique tracking sessions (`/?track=<shareId>`) allowing others to watch real-time movement live on the map.
- **Adaptive Throttling**: Intelligent GPS update frequency based on movement velocity and accuracy.
- **Session Expiration & Revocation**: Instant termination or automatic time-based expiry of active sessions.

### 🔐 Authentication & Role-Based Authorization
- **Spring Security + JWT**: Stateless token-based authentication with expiration (24h default).
- **Dual Roles**: `ROLE_USER` (standard accounts) and `ROLE_ADMIN` (privileged portal).
- **User Dashboard**: Manage saved favorite places with custom labels/notes, search history, and route history.
- **Non-Blocking Toasts**: Clean animated notification system replacing intrusive browser alerts.

### 📊 Admin Management Portal
- **System Metrics**: Real-time statistics on total registered users, spatial places, active live sharing sessions, and calculated routes.
- **Place Administration**: Add new spatial locations, update metadata, or delete outdated points of interest.
- **Telemetry & Health**: Live JVM memory status and system telemetry.

---

## 🛠️ Architecture & Tech Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Backend Framework** | Spring Boot 3.3.4 (Java 17) | RESTful API, Security, WebSocket broker |
| **Database** | PostgreSQL + PostGIS Extension | Spatial geometry (`geometry(Point, 4326)`), ST_DWithin & ST_MakeEnvelope |
| **ORM / Spatial** | Spring Data JPA + Hibernate Spatial | JTS (Java Topology Suite) coordinate mapping |
| **Security** | Spring Security + JJWT 0.12.6 | BCrypt password hashing & JWT token validation |
| **Real-time Comms** | Spring WebSocket + STOMP + SockJS | Message broker (`/topic/location/{shareId}`) |
| **Geospatial APIs** | OpenStreetMap Nominatim & Project OSRM | External geocoding and road network routing |
| **Frontend Framework** | React 19 + TypeScript + Vite 6 | Fast HMR dev server and strict typing |
| **Map Rendering** | Leaflet 1.9.4 | Canvas tile and vector geometry rendering |
| **UI Icons & Styling** | Lucide React + Vanilla Glassmorphic CSS | Modern, high-performance responsive UI |

---

## 📋 System Prerequisites

Before running the application, make sure the following software is installed on your machine:

1. **Java Development Kit (JDK 17 or higher)**
   - Check version: `java -version`
2. **Node.js (v18.x or v20.x recommended) & npm**
   - Check version: `node -v` and `npm -v`
3. **PostgreSQL (v13+ recommended) with PostGIS**
   - Must include PostGIS spatial extension (installable via Postgres Stack Builder on Windows or `sudo apt install postgresql-XX-postgis-3` on Linux).
4. **Git**
   - For repository cloning and branch management.

---

## 🗄️ Database Setup (PostgreSQL + PostGIS)

MapSphere requires PostgreSQL with the **PostGIS** extension enabled to perform spatial calculations.

### 1. Start the PostgreSQL Service
Make sure your PostgreSQL server is running on `localhost:5432`.

### 2. Create the Database and Enable PostGIS
Open your terminal, command line, or `psql` console:

```sql
-- Connect to PostgreSQL as superuser (postgres)
psql -U postgres

-- Create the database
CREATE DATABASE mapsphere;

-- Connect to the newly created database
\c mapsphere;

-- Enable the PostGIS spatial extension (MANDATORY)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify extension is installed
SELECT postgis_full_version();
```

> 💡 **pgAdmin Alternative**: If using pgAdmin GUI:
> 1. Right-click **Databases** ➡️ **Create** ➡️ **Database** named `mapsphere`.
> 2. Open the **Query Tool** on `mapsphere`.
> 3. Run: `CREATE EXTENSION IF NOT EXISTS postgis;`

### 3. Verify Database Credentials
Check `backend/src/main/resources/application.yml` and match your PostgreSQL password if different from default:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mapsphere
    username: postgres
    password: Admin@123   # <-- Change to your local PostgreSQL password
```

---

## 🚀 Step-by-Step Guide to Run the App

### 1. Run the Backend (Spring Boot)

Open a terminal in the project root directory:

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Run the application using the Maven Wrapper

# Windows (PowerShell or CMD):
.\mvnw.cmd spring-boot:run

# macOS / Linux:
./mvnw spring-boot:run
```

#### What happens during backend startup:
- Spring Boot initializes on **port 8081**.
- Hibernate connects to PostgreSQL and automatically generates/updates required spatial tables (`places`, `users`, `favorites`, `route_history`, `search_history`, `location_share_sessions`).
- `DataSeeder` automatically executes:
  - Registers the default **Admin Account**.
  - Seeds **13 realistic points of interest** (restaurants, hospitals, colleges, parks, banks, hotels, etc.) with coordinates and metadata.
- **Verify Backend Health**:
  Open your browser or run:
  ```bash
  curl http://localhost:8081/api/health
  # Response: {"status":"UP"}
  ```

---

### 2. Run the Frontend (React + Vite)

Open a **second terminal** in the project root directory:

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies (first-time only)
npm install

# 3. Start the Vite development server
npm run dev
```

#### Access the Application:
- Vite will start the frontend development server at:  
  **👉 [http://localhost:5173](http://localhost:5173)**
- Open this URL in your web browser (Chrome, Edge, Firefox, or Safari).

---

## 🐳 Docker Containerized Deployment

You can spin up the entire production stack (PostgreSQL + PostGIS, Redis Cache, Spring Boot Backend, and Nginx React Frontend) in one command:

```bash
# 1. Build and start all 4 services in the background
docker-compose up -d --build

# 2. View container logs in real time
docker-compose logs -f

# 3. Stop containers and retain persistent database volume
docker-compose down
```

| Service | Container Name | Port Mapping | Healthcheck |
| :--- | :--- | :--- | :--- |
| **PostgreSQL + PostGIS** | `mapsphere-postgres` | `5432:5432` | `pg_isready` |
| **Redis** | `mapsphere-redis` | `6379:6379` | In-memory cache |
| **Spring Boot API** | `mapsphere-backend` | `8081:8081` | `/api/health` |
| **React + Nginx** | `mapsphere-frontend` | `80:80` | HTTP 200 |

---

## ☁️ Cloud Deployment (Render & Vercel)

### Backend & PostGIS on Render:
1. Fork or push this repository to GitHub.
2. Go to **Render Dashboard** -> **Blueprints** -> **New Blueprint Instance**.
3. Connect your repository. Render automatically reads [render.yaml](file:///c:/MyFiles/Project/Map/render.yaml) and provisions:
   - A managed PostgreSQL instance with PostGIS (`mapsphere-db`).
   - A Dockerized Spring Boot Web Service (`mapsphere-backend`) with memory limits (`-XX:MaxRAMPercentage=75.0`).
4. Once deployed, note your Render backend URL: `https://mapsphere-backend.onrender.com`.

### Frontend on Vercel:
1. Go to **Vercel Dashboard** -> **Add New Project**.
2. Select the `frontend` folder as the root directory.
3. Configure the environment variables:
   - `VITE_API_URL` = `https://mapsphere-backend.onrender.com`
   - `VITE_WS_URL` = `https://mapsphere-backend.onrender.com`
4. Deploy. Vercel automatically applies [vercel.json](file:///c:/MyFiles/Project/Map/frontend/vercel.json) to handle SPA routing rewrites.

---

## 🔑 Default Credentials & Initial Seed Data

The application comes pre-populated with an administrative account and realistic POI dataset via `DataSeeder`:

### 👑 Admin Account
| Field | Value |
| :--- | :--- |
| **Email** | `admin@mapsphere.com` |
| **Password** | `Admin@12345` |
| **Role** | `ROLE_ADMIN` |
| **Privileges** | View Admin Dashboard statistics, manage system places |

### 👤 Regular User Account
You can register any regular account directly through the **Login / Register** modal in the top navbar.

### 📍 Pre-Seeded Spatial Places
13 initial spatial places across categories are seeded centered around Pollachi / Coimbatore region:
- **Spice Garden Restaurant** (`RESTAURANT`, 4.7★)
- **Green Leaf Cafe & Bakery** (`RESTAURANT`, 4.5★)
- **Pollachi Government Hospital** (`HOSPITAL`, 4.2★)
- **CareWell Multispecialty Clinic** (`HOSPITAL`, 4.8★)
- **The Royal Grand Hotel** (`HOTEL`, 4.6★)
- **Nature View Resort & Spa** (`HOTEL`, 4.9★)
- **Dr. Mahalingam College of Engineering (MCET)** (`COLLEGE`, 4.6★)
- **NGM Arts & Science College** (`COLLEGE`, 4.5★)
- **VOC Central Park & Gardens** (`PARK`, 4.4★)
- **Bharat Petroleum & EV Supercharger** (`PETROL_STATION`, 4.3★)
- **State Bank of India Main Branch** (`BANK`, 4.1★)
- **Apollo 24/7 Pharmacy** (`PHARMACY`, 4.8★)
- **City Center Shopping Mall** (`SHOP`, 4.4★)

---

## 🛰️ Live Location Sharing Workflow

MapSphere enables real-time device tracking using WebSockets:

```
[Broadcaster Browser] ---> Geolocation API (watchPosition)
        |
        v STOMP /app/location.update
[Spring Boot WebSocket Broker (Port 8081)]
        |
        v STOMP /topic/location/{shareId}
[Viewer Browser / Tracking Link ?track=XYZ] ---> Map marker smoothly updates in real-time
```

1. **Start Sharing**:
   - Log in and click the **Live Share** button in the navbar.
   - Click **Start Sharing Location**.
   - Copy the generated tracking URL (e.g., `http://localhost:5173/?track=3f8a92...`).
2. **Track in Real Time**:
   - Open the link in another browser tab, private window, or send it to a friend.
   - As the broadcaster moves or emits coordinates, the viewer's map marker updates live with speed, heading, and accuracy rings.
3. **Stop Sharing**:
   - Click **Stop Sharing** anytime from the modal to terminate the session immediately.

---

## 📡 API Endpoints Reference

### 1. Authentication (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register new user account with email & password |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user & return JWT token |

### 2. Spatial Places (`/api/v1/places`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/places` | Public | List all stored places |
| `GET` | `/api/v1/places/{id}` | Public | Retrieve detailed information for a place |
| `GET` | `/api/v1/places/nearby` | Public | Find places within radius (`lat`, `lng`, `radius` in meters) |
| `GET` | `/api/v1/places/bbox` | Public | Query places inside bounding box (`minLat`, `minLng`, `maxLat`, `maxLng`) |
| `POST` | `/api/v1/places` | Authenticated | Create a new place |
| `PUT` | `/api/v1/places/{id}` | Authenticated | Update place details |
| `DELETE` | `/api/v1/places/{id}` | Authenticated | Delete a place |

### 3. Search & Geocoding (`/api/v1/search`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/search` | Public | Search places with OSM Nominatim proxy (`q`, `lat`, `lng`) |
| `GET` | `/api/v1/search/reverse` | Public | Reverse geocode coordinates to street address (`lat`, `lng`) |

### 4. Routing & Directions (`/api/v1/routes`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/routes` | Public / Auth | Calculate route between origin & destination (`DRIVING`, `WALKING`, `CYCLING`) |

### 5. Live Location Sharing (`/api/v1/location`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/location/share` | Authenticated | Create a live location sharing session |
| `GET` | `/api/v1/location/track/{shareId}` | Public | Get metadata & last coordinates of an active share session |
| `DELETE` | `/api/v1/location/share/{shareId}` | Authenticated | Stop and revoke an active share session |

### 6. User Profile, Favorites & History (`/api/v1`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users/me` | Authenticated | Get current authenticated user profile |
| `GET` | `/api/v1/favorites` | Authenticated | Get saved favorite places |
| `POST` | `/api/v1/favorites` | Authenticated | Save a place to favorites with optional custom note/tag |
| `DELETE` | `/api/v1/favorites/{placeId}` | Authenticated | Remove place from favorites |
| `GET` | `/api/v1/history/search` | Authenticated | Get user search query history |
| `DELETE` | `/api/v1/history/search` | Authenticated | Clear user search history |
| `GET` | `/api/v1/history/routes` | Authenticated | Get user calculated route history |
| `DELETE` | `/api/v1/history/routes` | Authenticated | Clear user route history |

### 7. Admin & Health
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/stats` | Admin Only | Get total users, places, routes, and active sessions |
| `GET` | `/api/health` | Public | Health check endpoint returning `{ "status": "UP" }` |

### 8. WebSockets
- **Handshake Endpoint**: `http://localhost:8081/ws-mapsphere` (SockJS + STOMP)
- **Send Telemetry**: `/app/location.update`
- **Subscribe to Live Updates**: `/topic/location/{shareId}`

---

## 📂 Project Directory Structure

```text
Map/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/mapsphere/
│   │   │   │   ├── MapSphereApplication.java     # Spring Boot Main Entrypoint
│   │   │   │   ├── config/                       # Security, CORS, WebSocket, DataSeeder
│   │   │   │   ├── controller/                   # REST Controllers (Auth, Places, Routes, etc.)
│   │   │   │   ├── dto/                          # Data Transfer Objects
│   │   │   │   ├── entity/                       # JPA & Hibernate Spatial Entities (Place, User, etc.)
│   │   │   │   ├── exception/                    # Global Exception Handler
│   │   │   │   ├── repository/                   # Spring Data JPA Repositories (PostGIS queries)
│   │   │   │   ├── security/                     # JWT Authentication Filter & Token Provider
│   │   │   │   ├── service/                      # Business Logic Services
│   │   │   │   └── websocket/                    # WebSocket Controllers & Location Messages
│   │   │   └── resources/
│   │   │       └── application.yml               # Server port, PostgreSQL, JWT & API configuration
│   │   └── test/                                 # Unit & Integration Tests
│   ├── mvnw / mvnw.cmd                           # Maven Wrapper binaries
│   └── pom.xml                                   # Backend dependencies & build config
│
├── frontend/
│   ├── src/
│   │   ├── components/                           # MapView, Navbar, SearchBox, DirectionsPanel,
│   │   │                                         # Drawers, Modals (Auth, Admin, LiveShare)
│   │   ├── context/                              # AuthContext & User state management
│   │   ├── hooks/                                # useLocation (GPS), useWebSocket (STOMP)
│   │   ├── services/                             # API clients (auth, map, route, search, favorite)
│   │   ├── types/                                # TypeScript Interfaces & Enums
│   │   ├── App.tsx                               # Primary Application Layout & State orchestrator
│   │   ├── main.tsx                              # React DOM root mounting
│   │   └── index.css                             # Global styles, animations & design system
│   ├── package.json                              # Frontend scripts & dependencies
│   ├── tsconfig.json                             # TypeScript compiler configuration
│   └── vite.config.ts                            # Vite configuration
│
└── README.md                                     # Project Documentation (this file)
```

---

## ❓ Troubleshooting & FAQs

### 1. `org.postgresql.util.PSQLException: ERROR: type "geometry" does not exist`
- **Cause**: The PostgreSQL database does not have the PostGIS extension enabled.
- **Solution**: Connect to your database (`psql -U postgres -d mapsphere`) and run:
  ```sql
  CREATE EXTENSION IF NOT EXISTS postgis;
  ```

### 2. `Connection to localhost:5432 refused`
- **Cause**: PostgreSQL service is stopped or not running on port 5432.
- **Solution**:
  - **Windows**: Open Services (`services.msc`), find **postgresql-x64-XX**, and click **Start**.
  - **Linux / macOS**: Run `sudo systemctl start postgresql` or `brew services start postgresql`.

### 3. `Password authentication failed for user "postgres"`
- **Cause**: The password in `backend/src/main/resources/application.yml` doesn't match your local PostgreSQL password.
- **Solution**: Update `spring.datasource.password` in `application.yml` with your correct PostgreSQL password.

### 4. `Port 8081 or 5173 is already in use`
- **Backend (Port 8081)**: Change `server.port` in `application.yml` to another port (e.g. `8082`), and update `API_BASE_URL` in `frontend/src/services/api.ts`.
- **Frontend (Port 5173)**: Vite will automatically suggest or pick port `5174` if `5173` is busy.

### 5. `Geolocation not working in browser`
- **Cause**: Browsers require HTTPS or `localhost` to allow HTML5 Geolocation API permissions.
- **Solution**: Make sure you are accessing via `http://localhost:5173` (not `127.0.0.1` or raw IP) and click **Allow** when prompted for location access.

---

## 📜 License & Acknowledgments

- Map tiles & Geocoding data by © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors & [Nominatim](https://nominatim.org/).
- Routing calculation powered by [Project OSRM](http://project-osrm.org/).
- Built with ❤️ for seamless geospatial exploration and real-time collaboration.
