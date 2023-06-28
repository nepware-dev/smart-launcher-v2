export interface Role {
    readonly resourceType: 'Role';
    id: string;
    name: string;
    user: User['id'];
    links?: RoleLinks;
}

export interface RoleLinks {
    patient?: fhir4.Patient;
    practitioner?: fhir4.Practitioner;
}

export interface User {
    readonly resourceType: 'User';
    id: string;
    role?: Role['id'][];
    password?: string;
    email?: string;
    name?: string;
    userName: string;
}
