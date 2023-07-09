export interface Roles {
    reader: boolean;
    officer?: boolean;
    admin?: boolean;
    developer?: boolean;
}

export class User {
    /*
        This class represents a user's information as it is stored in firebase.
        Each argument must have a value, however some of these values may be "empty". For example, if a string's value is "", this means that there is no value in the data.
    */
    email: string;
    username: string;
    photoURL: string;
    firstName: string;
    lastName: string;
    roles: Roles;

    constructor(authData: { email: string, username: string, photoURL: string, firstName: string, lastName: string}) {
        this.email = authData.email
        this.username = authData.username
        this.photoURL = authData.photoURL
        this.firstName = authData.firstName
        this.lastName = authData.lastName
        this.roles = { reader: true }
    }
}
