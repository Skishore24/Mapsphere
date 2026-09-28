package com.mapsphere.config;

import com.mapsphere.entity.Place;
import com.mapsphere.entity.Role;
import com.mapsphere.entity.User;
import com.mapsphere.repository.PlaceRepository;
import com.mapsphere.repository.UserRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Configuration
public class DataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    @Bean
    public CommandLineRunner initDatabase(PlaceRepository placeRepository,
                                          UserRepository userRepository,
                                          PasswordEncoder passwordEncoder) {
        return args -> {
            // Seed Admin User if not present
            if (!userRepository.existsByEmail("admin@mapsphere.com")) {
                userRepository.save(User.builder()
                        .name("System Admin")
                        .email("admin@mapsphere.com")
                        .passwordHash(passwordEncoder.encode("Admin@12345"))
                        .role(Role.ADMIN)
                        .build());
                log.info("Default ADMIN user seeded: admin@mapsphere.com / Admin@12345");
            }

            // Seed initial places if empty
            if (placeRepository.count() < 5) {
                log.info("Seeding realistic initial places across multiple categories...");

                List<Place> initialPlaces = List.of(
                        createPlace("Spice Garden Restaurant", "Authentic South Indian & Biryani specialties",
                                "RESTAURANT", "12 Market Road, Pollachi", 10.6580, 77.0080, "+91 98421 11223", "https://spicegarden.local", 4.7),

                        createPlace("Green Leaf Cafe & Bakery", "Artisan coffee, snacks, pastries, and outdoor seating",
                                "RESTAURANT", "45 College Road, Pollachi", 10.6620, 77.0040, "+91 98421 44556", "https://greenleaf.local", 4.5),

                        createPlace("Pollachi Government Hospital", "24/7 Emergency Care and multi-specialty trauma unit",
                                "HOSPITAL", "Government Hospital Road, Pollachi", 10.6650, 77.0120, "+91 4259 223344", "https://ghpollachi.gov.in", 4.2),

                        createPlace("CareWell Multispecialty Clinic", "Outpatient cardiology, diagnostics, and pharmacy",
                                "HOSPITAL", "88 New Scheme Road, Pollachi", 10.6520, 77.0010, "+91 94432 77889", "https://carewell.local", 4.8),

                        createPlace("The Royal Grand Hotel", "Luxury boutique hotel with pool, suites, and conference center",
                                "HOTEL", "Coimbatore Main Road, Pollachi", 10.6710, 77.0150, "+91 4259 233445", "https://royalgrand.local", 4.6),

                        createPlace("Nature View Resort & Spa", "Eco-friendly coconut grove cottages and ayurvedic wellness",
                                "HOTEL", "Aliyar Dam Road, Pollachi", 10.5900, 76.9700, "+91 98422 99881", "https://natureview.local", 4.9),

                        createPlace("Dr. Mahalingam College of Engineering (MCET)", "Premier technical engineering college & research institution",
                                "COLLEGE", "Udumalai Road, Pollachi", 10.6820, 77.0350, "+91 4259 236030", "https://mcet.in", 4.6),

                        createPlace("NGM Arts & Science College", "Prestigious autonomous institution with heritage campus",
                                "COLLEGE", "Palakkad Road, Pollachi", 10.6430, 76.9950, "+91 4259 234868", "https://ngmc.org", 4.5),

                        createPlace("VOC Central Park & Gardens", "Lush municipal park with walking trails, fountains, and play area",
                                "PARK", "Park Road, Pollachi", 10.6600, 77.0060, "+91 4259 220011", "", 4.4),

                        createPlace("Bharat Petroleum Fuel & EV Supercharger", "24-hour petrol, diesel, and fast EV DC charging station",
                                "PETROL_STATION", "Highway Bypass, Pollachi", 10.6480, 77.0190, "+91 98420 33445", "", 4.3),

                        createPlace("State Bank of India (Main Branch)", "Full banking services, safe deposit lockers, and multi-currency exchange",
                                "BANK", "Bazaar Street, Pollachi", 10.6590, 77.0070, "+91 4259 224411", "https://sbi.co.in", 4.1),

                        createPlace("Apollo 24/7 Pharmacy", "All prescription medicines, first aid supplies, and health diagnostics",
                                "PHARMACY", "Opposite Bus Stand, Pollachi", 10.6575, 77.0095, "+91 98425 66778", "https://apollopharmacy.in", 4.8),

                        createPlace("City Center Shopping Mall & Supermarket", "Multi-brand retail apparel, electronics, groceries, and food court",
                                "SHOP", "Palani Road, Pollachi", 10.6550, 77.0130, "+91 4259 255667", "", 4.4)
                );

                placeRepository.saveAll(initialPlaces);
                log.info("Successfully seeded {} places into PostgreSQL!", initialPlaces.size());
            }
        };
    }

    private Place createPlace(String name, String desc, String category, String address,
                              double lat, double lng, String phone, String website, double rating) {
        return Place.builder()
                .name(name)
                .description(desc)
                .category(category)
                .address(address)
                .location(geometryFactory.createPoint(new Coordinate(lng, lat)))
                .phone(phone)
                .website(website)
                .rating(rating)
                .build();
    }
}
