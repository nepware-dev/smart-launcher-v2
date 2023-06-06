import { Request, Response } from "express"
import { HttpError} from "../../errors"
import {users} from "./authData"

export interface AuthorizeParams {
    username: string
    password: string
}

export interface User {
    id: number
    username: string
    email: string
    password: string
}

/**
 * @see: https://tools.ietf.org/html/rfc7662
 */
export default function login(req: Request, res: Response) {
    const params: AuthorizeParams = req.body

    const user: User | undefined  = users.find(u => u.username === params.username && u.password === params.password)

    console.log(params);

    if(!user) {
        res.status(403).send({error: 'invalid_credential', message: "Cannot find any user with given credential"});
    } else {
        res.json({statue: true});
    }
}
