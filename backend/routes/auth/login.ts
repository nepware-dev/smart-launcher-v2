import { Request, Response } from "express"
import {users} from "./authData"
import {User} from './types';

export interface AuthorizeParams {
    username: string;
    password: string;
    loginType: 'provider' | 'patient';
}

export enum UserRoleLoginType {
    patient = 'patient',
    provider = 'admin',
}

/**
 * @see: https://tools.ietf.org/html/rfc7662
 */
export default function login(req: Request, res: Response) {
    const params: AuthorizeParams = req.body;

    const user: User | undefined  = users.find(u => {
        return u.userName === params.username && u.password === params.password;
    });

    if(!user) {
        res.status(403).send({error: 'invalid_credential', message: "Cannot find any user with given credential"});
    } else if(user.role?.[0] !== UserRoleLoginType[params.loginType]) {
        res.status(403).send({
            error: 'invalid_credential',
            message: `Unable to login as ${params.loginType === 'provider' ? 'pracitioner' : params.loginType}`,
        });
    } else {
        res.json({statue: true});
    }
}
