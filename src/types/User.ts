export interface Roles {
    reader: boolean;
    officer?: boolean;
    admin?: boolean;
    developer?: boolean;
}

export class User {
    email: string;
    username: string;
    photoURL: string;
    roles: Roles;
    firstName: string;
    lastName: string;

    constructor(authData: { email: string, username: string, photoURL: string, firstName: string, lastName: string}) {
        this.email = authData.email
        this.username = authData.username
        this.photoURL = authData.photoURL
        this.firstName = authData.firstName
        this.lastName = authData.lastName
        this.roles = { reader: true }
    }
}
