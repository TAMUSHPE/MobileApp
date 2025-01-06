import { Roles, User } from "../types/user";

export const hasPrivileges = (
    userInfo: User,
    roles: (keyof Roles)[] = ['admin', 'officer', 'developer', 'lead', 'representative']
) => {
    const userRoles = userInfo?.publicInfo?.roles || {};
    return roles.some(role => userRoles[role]?.valueOf());
};

