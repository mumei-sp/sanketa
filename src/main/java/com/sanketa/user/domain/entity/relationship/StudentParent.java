package com.sanketa.user.domain.entity.relationship;

import com.sanketa.user.domain.entity.Parent;
import com.sanketa.user.domain.entity.Student;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Student-Parent relationship entity.
 * 
 * @author mumei
 */
@Entity
@Table(name = "student_parents", 
       uniqueConstraints = @UniqueConstraint(name = "uk_student_parent", 
                                            columnNames = {"student_profile_id", "parent_profile_id"}),
       indexes = {
           @Index(name = "idx_student_parents_student_profile_id", columnList = "student_profile_id"),
           @Index(name = "idx_student_parents_parent_profile_id", columnList = "parent_profile_id")
       })
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentParent {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_profile_id", nullable = false, 
                foreignKey = @ForeignKey(name = "fk_student_parents_student"))
    private Student student;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_profile_id", nullable = false, 
                foreignKey = @ForeignKey(name = "fk_student_parents_parent"))
    private Parent parent;
    
    @Column(name = "relationship", length = 50, nullable = false)
    private String relationship; // e.g., "father", "mother", "guardian"
    
    @Column(name = "is_primary", nullable = false)
    @Builder.Default
    private Boolean isPrimary = false;
    
    @Column(name = "created_at", nullable = false, updatable = false, columnDefinition = "DATETIME(6)")
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
