package org.onboardme.transformers;

import com.onboardme.model.RoleDTO;
import com.onboardme.model.UserDTO;
import org.onboardme.dao.entities.Role;
import org.onboardme.dao.entities.User;
import org.springframework.stereotype.Component;

import java.time.ZoneId;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

@Component
public class UserTransformer {

    public UserDTO buildUserResponse(User user) {
        return buildUserResponse(user, new HashSet<>());
    }

    private UserDTO buildUserResponse(User user, Set<Long> visitedIds) {
        if (user == null) return null;

        // Prevención de ciclos
        if (visitedIds.contains(user.getId())) {
            return null;
        }

        visitedIds.add(user.getId());

        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setArea(user.getArea());
        dto.setStatus(user.getStatus());
        dto.setBuddy(buildUserResponse(user.getBuddy(), visitedIds));
        dto.setAddress(user.getAddress());
        dto.setPhone(user.getPhone());
        //dto.setBirthDate(user.getBirthDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDate());

        if (user.getBirthDate() != null) {
            dto.setBirthDate(user.getBirthDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDate());
        }

        if (user.getCreatedDate() != null) {
            dto.setCreatedDate(user.getCreatedDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDate());
        }

        if (user.getRole() != null) {
            dto.setRole(buildRolResponse(user.getRole()));
        }

        return dto;
    }

    public RoleDTO buildRolResponse(Role role) {
        RoleDTO dto = new RoleDTO();
        dto.setId(role.getId());
        dto.setName(role.getName());
        return dto;
    }
}

