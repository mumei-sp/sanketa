package com.sanketa.user.domain.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

/**
 * Parent/Guardian profile entity.
 * 
 * @author mumei
 */
@Entity
@Table(name = "parents", indexes = {
    @Index(name = "idx_parents_profile_id", columnList = "profile_id")
})
@DiscriminatorValue("parent")
@PrimaryKeyJoinColumn(name = "profile_id", referencedColumnName = "id")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
public class Parent extends UserProfile {
    
    @Column(name = "occupation", length = 100)
    private String occupation;
    
    @Column(name = "workplace", length = 200)
    private String workplace;
    
    @Column(name = "parent_info", columnDefinition = "JSON")
    @Builder.Default
    private String parentInfo = "{}"; // JSON object for additional parent info
}
