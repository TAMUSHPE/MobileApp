import { Roles, User } from "../types/user";

/**
 * Returns a boolean stating whether or not a user object has the given roles.
 * 
 * Note that these are not the same as *claims* and should only be used for frontend things like
 * accessing certain screens or showing certain buttons.
 * 
 * @param   userInfo   The user information object.
 * @param   roles      The roles to check for the given user.
 * @returns {boolean}  Whether or not the given `User` object has the specified roles.
 * 
 * @example
 * const isSuperuser = hasPrivileges(user, ['admin', 'developer']);
 */
export const hasPrivileges = (
    userInfo: User,
    roles: (keyof Roles)[] = ['admin', 'officer', 'developer', 'lead', 'representative']
): boolean => {
    const userRoles = userInfo?.publicInfo?.roles || {};
    return roles.some(role => userRoles[role]?.valueOf());
};

