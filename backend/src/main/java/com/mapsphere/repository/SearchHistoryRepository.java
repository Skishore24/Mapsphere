package com.mapsphere.repository;

import com.mapsphere.entity.SearchHistory;
import com.mapsphere.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SearchHistoryRepository extends JpaRepository<SearchHistory, Long> {
    List<SearchHistory> findTop20ByUserOrderByCreatedAtDesc(User user);
    void deleteByUser(User user);
}
