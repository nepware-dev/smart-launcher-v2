import type {User, Role} from './types';

export const clients = [{
    client_id: 'smartonfhir',
    client_secret: 'this1ssup3rs3cr3t',
    redirect_uris: ['http://lvh.me:8080/cb'],
    grant_types: ["authorization_code"],
    scope: "patient/*.* user/*.* launch launch/patient launch/encounter openid fhirUser profile offline_access"
},{
    client_id: 'launcherUI',
    client_secret: 'this1ssup3rs3cr3t',
    redirect_uris: ['http://lvh.me:8080/cb'],
    grant_types: ["authorization_code"],
    scope: "patient/*.rs user/*.rs launch launch/patient.rs launch/encounter.rs openid fhirUser profile offline_access"
}];

export const roles: Role[] = [
    {
        resourceType: 'Role',
        id: 'admin',
        name: 'admin',
        user: 'admin1',
    },
    {
        resourceType: 'Role',
        id: 'patient',
        name: 'patient',
        user: 'patient1',
    },
];

export const users: User[] = [{
    resourceType: 'User',
    id: 'admin1',
    userName: 'admin',
    password: 'password',
    role: ['admin'],
},{
    resourceType: 'User',
    id: 'patient1',
    userName: 'patient',
    password: 'password',
    role: ['patient'],
}];
