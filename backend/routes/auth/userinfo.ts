import {Request, Response} from "express"
import jwt from "jsonwebtoken"
import {
    OAuthError
} from "../../errors"

import config from "../../config"
import {users, roles} from './authData';

export default function userinfo(req: Request, res: Response) {
    if(!req.headers.authorization) {
        res.status(401).send("Authorization is required");
        return;
    }

    try {
        var authorizationToken = jwt.verify(req.headers.authorization.split(" ")?.[1], config.jwtSecret) as Record<string, any>;
    } catch(ex: any) {
        if(ex?.name === 'TokenExpiredError') {
            throw new OAuthError("Expired token").errorId("expired_token").status(401);
        }
        throw new OAuthError("Invalid token").errorId("invalid_token").status(401);
    }

    const [userResourceType, userId] = authorizationToken.fhirUser?.split('/') || [];
    if(!userId) {
        res.status(403).send({error: 'invalid_token', message: "Cannot find any user for token"});
        return;
    }

    // FIXME: Get User Response from database.
    const userRole = userResourceType.toLowerCase() === 'practitioner' ? 'admin' : 'patient';
    const userInfoData = users.find(usr => {
        return usr.userName === userRole; // FIXME: Should be matching userId.
    });
    if(!userInfoData) {
        res.status(404).send({error: 'user_not_found', message: "Cannot find user!"});
        return;
    }
    const userResponse = {
        ...userInfoData,
        role: (userInfoData.role || []).map(userRole => ({
            ...(roles.find(role => role.id === userRole) || {}),
            user: {...userInfoData, id: userId},
            links: {
                [userResourceType.toLowerCase()]: {
                    id: userId,
                    resourceType: userResourceType,
                },
            },
        })),
    };
    delete userResponse.password;

    res.json(userResponse);
}
