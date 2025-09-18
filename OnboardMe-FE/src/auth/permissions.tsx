export enum RoleName {
    ADMIN = 'Admin',
    EMPLOYEE = 'Empleado',
    RRHH = 'RRHH',
    BUDDY = 'Buddy'
}

export enum PermissionEnum {
    viewDashboard = "viewDashboard",
    editUsers = "editUsers",
    viewMetrics = "viewMetrics",
    viewCourses = "viewCourses",
    assignCourses  = "assignCourses"
}

export const permissions: Record<RoleName, string[]> = {
    [RoleName.ADMIN]: [PermissionEnum.viewDashboard, PermissionEnum.viewCourses, PermissionEnum.editUsers, PermissionEnum.viewMetrics, PermissionEnum.assignCourses],
    [RoleName.EMPLOYEE]: [PermissionEnum.viewDashboard, PermissionEnum.viewCourses],
    [RoleName.RRHH]: [PermissionEnum.viewDashboard, PermissionEnum.editUsers, PermissionEnum.viewMetrics, PermissionEnum.assignCourses],
    [RoleName.BUDDY]: [PermissionEnum.viewDashboard, PermissionEnum.viewCourses, PermissionEnum.viewMetrics, PermissionEnum.assignCourses],
};

export type Permission = (typeof permissions)[RoleName][number];

export const hasPermission = (roleName: string, permission: PermissionEnum): boolean => {
    const validRoles = Object.values(RoleName) as string[];

    if (!validRoles.includes(roleName)) {
        console.warn(`Rol desconocido: ${roleName}`);
        return false;
    }

    return permissions[roleName as RoleName]?.includes(permission) ?? false;
};


