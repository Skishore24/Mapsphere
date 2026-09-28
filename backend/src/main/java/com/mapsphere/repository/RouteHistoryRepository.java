package com.mapsphere.repository;

import com.mapsphere.entity.RouteHistory;
import com.mapsphere.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RouteHistoryRepository extends JpaRepository<RouteHistory, Long> {
    List<RouteHistory> findTop20ByUserOrderByCreatedAtDesc(User user);
    void deleteByUser(User user);
}
