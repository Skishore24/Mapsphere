package com.mapsphere.repository;

import com.mapsphere.entity.SearchHistory;
import com.mapsphere.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SearchHistoryRepository extends JpaRepository<SearchHistory, Long> {
    List<SearchHistory> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    List<SearchHistory> findTop20ByUserOrderByCreatedAtDesc(User user);
    void deleteByUser(User user);
    void deleteByIdAndUser(Long id, User user);
}
