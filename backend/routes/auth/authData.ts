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

export const users = [{
    id: 1,
    username: '1',
    email: 'bishaltimilsina@gmail.com',
    password: 'test@123',
},{
    id: 253825,
    username: '253825',
    email: 'bishaltimilsina@gmail.com',
    password: 'test@123',
},{
    id: 232136,
    username: '232136',
    email: 'bishaltimilsina@gmail.com',
    password: 'test@123',
}];
