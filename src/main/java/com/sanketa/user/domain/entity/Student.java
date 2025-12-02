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
 * Student-specific profile entity.
 * This entity extends UserProfile using JPA JOINED inheritance strategy.
 * The student-specific fields are stored in the students table, while
 * common profile fields are in the user_profiles table.
 * 
 * JPA automatically handles the JOIN between user_profiles and students
 * tables based on the profile_id foreign key.
 * 
 * @author mumei
 */
@Entity
@Table(name = "students", indexes = {
    @Index(name = "idx_students_grade_level", columnList = "grade_level"),
    @Index(name = "idx_students_section", columnList = "section")
})
@DiscriminatorValue("0") // STUDENT = 0
@PrimaryKeyJoinColumn(name = "profile_id")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
public class Student extends UserProfile {
    
    @Column(name = "student_id", length = 50, unique = true, nullable = false)
    private String studentId;
    
    @Column(name = "admission_number", length = 50, unique = true)
    private String admissionNumber;
    
    @Column(name = "admission_date")
    private LocalDate admissionDate;
    
    @Column(name = "roll_number", length = 20)
    private String rollNumber;
    
    @Column(name = "grade_level", length = 50)
    private String gradeLevel;
    
    @Column(name = "section", length = 20)
    private String section;

    @Override
    public ProfileType getProfileType() {
        return ProfileType.STUDENT;
    }
}
