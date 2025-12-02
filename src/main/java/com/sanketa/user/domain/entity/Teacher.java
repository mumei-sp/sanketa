package com.sanketa.user.domain.entity;

import com.sanketa.fabric.globaldb.model.enums.ProfileType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDate;

/**
 * Teacher-specific profile entity.
 *
 * @author mumei
 */
@Entity
@Table(name = "teachers", indexes = {
    @Index(name = "idx_teachers_department", columnList = "department")
})
@DiscriminatorValue("1") // TEACHER = 1 (matches ProfileType.TEACHER.getCode())
@PrimaryKeyJoinColumn(name = "profile_id")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
public class Teacher extends UserProfile {
    
    @Column(name = "employee_id", length = 50, unique = true, nullable = false)
    private String employeeId;
    
    @Column(name = "qualification", columnDefinition = "JSON")
    private String qualification; // JSON array of qualifications
    
    @Column(name = "specialization", columnDefinition = "JSON")
    private String specialization; // JSON array of specializations
    
    @Column(name = "joining_date")
    private LocalDate joiningDate;
    
    @Column(name = "department", length = 100)
    private String department;
    
    @Column(name = "professional_info", columnDefinition = "JSON")
    @Builder.Default
    private String professionalInfo = "{}"; // JSON object for additional professional info

    @Override
    public ProfileType getProfileType() {
        return ProfileType.TEACHER;
    }
}
