package com.mapsphere.config;

import com.mapsphere.entity.Place;
import com.mapsphere.entity.Role;
import com.mapsphere.entity.User;
import com.mapsphere.repository.PlaceRepository;
import com.mapsphere.repository.UserRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final PlaceRepository placeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    public DataSeeder(PlaceRepository placeRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.placeRepository = placeRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Seed default Admin user if not exists
        if (!userRepository.existsByEmail("admin@mapsphere.com")) {
            userRepository.save(User.builder()
                    .name("System Administrator")
                    .email("admin@mapsphere.com")
                    .passwordHash(passwordEncoder.encode("AdminPass123"))
                    .role(Role.ADMIN)
                    .build());
        }

        // Seed sample places across Pollachi & Coimbatore region if empty
        if (placeRepository.count() <= 3) {
            placeRepository.deleteAll();

            List<Place> initialPlaces = List.of(
                    createPlace("Green Garden Restaurant", "Fine dining multi-cuisine family restaurant", "RESTAURANT", "12 Coimbatore Road, Pollachi", 10.6582, 77.0094, "+91 98765 43210", "https://greengarden.com", 4.7),
                    createPlace("Pollachi Government Hospital", "24/7 Emergency Care and Multi-specialty Hospital", "HOSPITAL", "Hospital Road, Pollachi", 10.6620, 77.0050, "+91 4259 223344", "https://ghpollachi.gov.in", 4.4),
                    createPlace("Grand Palace Hotel", "Luxury stay with city view, pool, and breakfast", "HOTEL", "New Scheme Road, Pollachi", 10.6540, 77.0120, "+91 4259 234567", "https://grandpalacehotel.com", 4.6),
                    createPlace("Mahalingam College of Engineering", "Premier engineering and technology institution", "COLLEGE", "Udumalai Road, Pollachi", 10.6820, 77.0420, "+91 4259 236030", "https://mcet.in", 4.8),
                    createPlace("Central City Park", "Public recreational park with jogging track and lake", "PARK", "Gandhi Nagar, Pollachi", 10.6650, 77.0100, "", "", 4.3),
                    createPlace("Apollo Pharmacy", "24/7 Prescription medicines and healthcare supplies", "PHARMACY", "Market Road, Pollachi", 10.6590, 77.0040, "+91 4259 255555", "https://apollopharmacy.in", 4.5),
                    createPlace("Shell Petrol & EV Station", "Fuel, EV supercharging, and convenience store", "PETROL_STATION", "Palakkad Highway, Pollachi", 10.6480, 76.9950, "+91 4259 288888", "https://shell.com", 4.6),
                    createPlace("State Bank of India & ATM", "Full-service banking branch with 24/7 cash deposit/ATM", "BANK", "Main Bazaar, Pollachi", 10.6570, 77.0075, "+91 4259 211111", "https://sbi.co.in", 4.2),
                    createPlace("Royal Heritage Cafe", "Artisan coffee, snacks, bakery, and free Wi-Fi", "RESTAURANT", "Station Road, Pollachi", 10.6605, 77.0065, "+91 98421 11223", "https://royalheritagecafe.com", 4.9),
                    createPlace("Coimbatore Junction Railway Station", "Major railway junction connecting southern India", "OTHER", "State Bank Road, Coimbatore", 11.0016, 76.9629, "+91 422 2300131", "https://indianrail.gov.in", 4.4),
                    createPlace("Brookefields Mall", "Shopping center with cinema, food court, and retail brands", "SHOP", "Krishnasamy Road, Coimbatore", 11.0125, 76.9558, "+91 422 2255555", "https://brookefields.com", 4.6)
            );

            placeRepository.saveAll(initialPlaces);
        }
    }

    private Place createPlace(String name, String desc, String category, String address, double lat, double lng, String phone, String website, double rating) {
        Point point = geometryFactory.createPoint(new Coordinate(lng, lat));
        return Place.builder()
                .name(name)
                .description(desc)
                .category(category)
                .address(address)
                .location(point)
                .phone(phone)
                .website(website)
                .rating(rating)
                .build();
    }
}
