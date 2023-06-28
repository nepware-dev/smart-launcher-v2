import jwt, {JwtHeader} from "jsonwebtoken"
import { NextFunction, Request, Response, RequestHandler } from "express"
import config from "./config";
import { HttpError, InvalidRequestError } from "./errors";


/**
 * Given a request object, returns its base URL
 */
export function getRequestBaseURL(req: Request) {
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
    return protocol + "://" + host;
}

/**
 * Creates and returns a route-wrapper function that allows for using an async
 * route handlers without try/catch.
 */
export function asyncRouteWrap(fn: RequestHandler) {
    return (req: Request, res: Response, next: NextFunction) => Promise.resolve(
        fn(req, res, next)
    ).catch(next);
}

const RE_FALSE = /^(0|no|false|off|null|undefined|NaN|)$/i;

export function bool(x: any): boolean {
    return !RE_FALSE.test(String(x).trim());
}

export function requireUrlencodedPost(req: Request) {
    if (!req.is("application/x-www-form-urlencoded")) {
        throw new InvalidRequestError(
            "Invalid request content-type header '%s' (must be 'application/x-www-form-urlencoded')",
            req.headers["content-type"]
        ).status(400)
    }
}

export function notSupported(message: string = "", code = 400) {
    return (req: Request) => {
        throw new HttpError(message || `${req.method} ${req.originalUrl} is not supported by this server`).status(code)
    };
}

export function getFhirServerBaseUrl(req: Request) {
    const fhirVersion = req.params.fhir_release.toUpperCase();
    let fhirServer = config[`fhirServer${fhirVersion}` as keyof typeof config] as string;

    // Env variables like FHIR_SERVER_R2_INTERNAL can be set to point the
    // request to different location. This is useful when running as a Docker
    // service and the fhir servers are in another service container
    if (process.env["FHIR_SERVER_" + fhirVersion + "_INTERNAL"]) {
        fhirServer = process.env["FHIR_SERVER_" + fhirVersion + "_INTERNAL"] as string;
    }

    if (!fhirServer) {
        throw new HttpError('FHIR server "%s" not found', req.params.fhir_release).status(400);
    }

    return fhirServer
}

export function validateToken(req: Request, required = false) {
    
    if (!req.headers.authorization) {
        if (required) {
            throw new HttpError("Unauthorized! No authorization header provided in request.").status(401)
        }
        return;
    }

    // require a valid auth token if there is an auth token
    try {
        var token = jwt.verify(
            req.headers.authorization.split(" ")[1],
            config.jwtSecret
        );
    } catch (e) {
        throw new HttpError("Invalid token: " + (e as Error).message).status(401)
    }

    if (!token || typeof token !== "object") {
        throw new HttpError("Invalid token").status(400)
    }

    if (token.sim_error) {
        throw new HttpError(token.sim_error).status(401)
    }
}

export function validateScope(req: Request, required = false) {
    const permissionMatrix = {
        'GET': 'r',
        'POST': 'c',
        'DELETE': 'd',
        'PUT': 'u',
    };
    var {
        payload: token
    } = jwt.decode(req.headers.authorization.split(" ")?.[1], { complete: true, json: true }) as {
        header: JwtHeader
        payload: Record<string, any>
    }

    const requestPath = req.path;
    const method = req.method as String;
    const resourceType = requestPath.split('/')[1];

    // check launch/encounter
    if(token.scope?.includes('launch/patient') && resourceType.toLowerCase() === 'patient') {
        return;
    }
    if(token.scope?.includes('launch/encounter') && resourceType.toLowerCase() === 'encounter') {
        return;
    }
    if(token.scope?.match(/user\/.*\..*/) /*
        FIXME: This should give permission to more resources than practitioner
        only.
        && resourceType.toLowerCase() === 'practitioner'
                                           */) {
        return;
    }
    if(token.scope?.match(/patient\/.*\..*/)) {
        return;
    }
    const scope = token.scope?.split(' ')?.find((s: string) => s.match(new RegExp(resourceType+'\/.*', 'i')));
    
    if(!scope) {
        throw new HttpError("Not enough permission to access the resource").status(403)
    }

    let permission = permissionMatrix[method];
    if(requestPath.endsWith('_search')) {
        permission = 's';
    }

    const scopePermissions = scope.split('.').pop() as String;
    if(scopePermissions !== '*' && !scopePermissions.includes(permission)) {
        throw new HttpError("Not enough permission").status(403)
    }
}

export function humanizeArray(arr: string[], quote = false) {
    if (arr.length < 1) {
        return ""
    }

    if (quote) {
        arr = arr.map(s => JSON.stringify(s))
    }

    if (arr.length < 2) {
        return arr[0]
    }
    
    const last = arr.pop();
    return arr.join(", ") + " and " + last;
}
