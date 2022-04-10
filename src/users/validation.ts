import { AuthenticatedRequest } from 'express';
import Result from 'src/common/result';
import { core, RequestCheckError, Schema } from 'src/validation';
import * as db from './db';

// Validation
// --------------------------------------------
/** Check if user already exists */
async function exists(req: AuthenticatedRequest): Promise<Result<RequestCheckError>> {
    const result = await db.exists(req.user.emails[0].value);

    if (result.ok && result.value) {
        return new Result(true, { msg: 'user exists' });
    }
    return new Result(result.ok);
}

/** Check if a user doesn't exist */
async function notExists(req: AuthenticatedRequest): Promise<Result<RequestCheckError>> {
    const result = await db.existsUUID(req.params.user);

    if (result.ok && !result.value) {
        return new Result(true, {
            status: 404,
            msg: "user doesn't exist",
        });
    }
    return new Result(result.ok);
}


// Middleware Options
// --------------------------------------------
export const postSchema: Schema = {
    accountOptional: true,
    checks: [exists],
};

export const getSchema: Schema = {
    params: {
        user: [ core.uuid ],
    },
    checks: [notExists],
};

export const putMeSchema: Schema = {
    body: {
        firstName: {
            required: true,
            type: 'text',
        },
        lastName: {
            required: true,
            type: 'text',
        },
    },
};

export const avatarSchema: Schema = {
    file: {
        mimetype: ['image/jpeg', 'image/png'],
    },
};
