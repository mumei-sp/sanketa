package com.sanketa.user.domain.entity;

import com.sanketa.fabric.globaldb.model.enums.ProfileType;
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
@Table(name = "parents")
@DiscriminatorValue("2") // PARENT = 2
@PrimaryKeyJoinColumn(name = "profile_id")
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

    @Override
    public ProfileType getProfileType() {
        return ProfileType.PARENT;
    }
}
