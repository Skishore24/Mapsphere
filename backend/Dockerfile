# ==============================================================================
# Multi-stage Dockerfile for MapSphere Spring Boot Backend (Render optimized)
# ==============================================================================

# Stage 1: Build the JAR package with Maven
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app

# Cache Maven dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy application source code and compile
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Lightweight runtime image
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Run as non-privileged spring user for security
RUN addgroup --system spring && adduser --system spring --ingroup spring
USER spring:spring

# Copy compiled jar
COPY --from=builder /app/target/mapsphere-0.0.1-SNAPSHOT.jar app.jar

# Render assigns PORT dynamically (defaults to 8081 for local test)
ENV PORT=8081
EXPOSE ${PORT}

# Production JVM flags with container-aware memory allocation (prevents Render OOM)
ENTRYPOINT ["java", "-XX:+UseG1GC", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
