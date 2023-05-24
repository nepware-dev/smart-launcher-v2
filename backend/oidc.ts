import Provider from 'oidc-provider';
import config from "./config"

const configuration = {
  async findAccount(_, id) {
    return {
      accountId: id,
      async claims(_, scope) {
        if(!scope) return undefined;

        const openid = { sub: id };
        const accountInfo = {};
        if(scope.includes("openid")) Object.assign(accountInfo, openid);
        return accountInfo;
      },
    };
  },
  clients: [{
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
  }],
  routes: {
    authorization: '/auth',
  },
};

const oidc = new Provider(`http://${config.host}:${config.port}`, configuration);
export default oidc;
