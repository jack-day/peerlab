import { Request, AuthenticatedRequest } from 'express';
import Result from 'src/common/result';
import { core, Schema, RequestCheckError } from 'src/validation';
import { inviteDuration } from './services';
import * as db from './db';

// Authorisation
// --------------------------------------------
export async function classAuth(req: AuthenticatedRequest): Promise<Result<RequestCheckError>> {
    const result = await db.userCanAccess(
        req.params.class,
        req.user.emails[0].value
    );
    
    if (result.ok && !result.value) {
        return new Result(true, {
            code: 404,
            msg: 'class does not exist',
        });
    }
    return new Result(result.ok);
}


// Validation
// --------------------------------------------
/** Check if class already exists */
async function exists(req: Request): Promise<Result<RequestCheckError>> {
    const result = await db.exists(req.body.shortName);

    if (result.ok && result.value) {
        return new Result(true, {
            field: 'shortName',
            msg: 'Short name is already taken',
        });
    }
    return new Result(result.ok);
}

/** Check if a user is not the owner of the class */
export async function isNotOwner(req: AuthenticatedRequest): Promise<Result<RequestCheckError>> {
    const result = await db.userIsOwner(
        req.params.class,
        req.user.emails[0].value
    );

    if (result.ok && !result.value) {
        return new Result(true, { msg: 'must be the class owner' });
    }
    return new Result(result.ok);
}

/** Check new short name in PUT update request is not already taken */
async function putShortNameExists(req: Request): Promise<Result<RequestCheckError>> {
    if (req.params.class !== req.body.shortName) {
        return await exists(req);
    }
    return new Result(true);
}

/** Check if a user is not a member of the class */
export async function userIsNotMember(req: AuthenticatedRequest): Promise<Result<RequestCheckError>> {
    const result = await db.userIsMember(
        req.params.class,
        req.params.user
    );

    if (result.ok && !result.value) {
        return new Result(true, { msg: 'user is not a member of the class' });
    }
    return new Result(result.ok);
}

/** Check if a member is the owner of a class */
export async function memberIsOwner(req: AuthenticatedRequest): Promise<Result<RequestCheckError>> {
    const result = await db.userIsOwnerUUID(
        req.params.class,
        req.params.user
    );

    if (result.ok && result.value) {
        return new Result(true, { msg: 'member cannot be the owner of the class' });
    }
    return new Result(result.ok);
}

/**
 * Check if an invite doesn't exist or is expired,
 * deleting the invite if it is expired
 */
async function invalidInvite(req: AuthenticatedRequest): Promise<Result<RequestCheckError>> {
    const createTime = await db.getInviteCreateTime(req.params.invite);
    const invalid = new Result(true, {
        code: 404,
        msg: 'invite does not exist or is expired',
    });

    if (createTime.ok) {
        if (createTime.value) {
            const createTimeMs = new Date(createTime.value).valueOf();
            const expired = new Date(createTimeMs + inviteDuration) < new Date();

            if (!expired) {
                return new Result(true);
            } else {
                await db.deleteInvite(req.params.invite);
                return invalid;
            }
        } else {
            return invalid;
        }
    } else {
        return new Result(false);
    }
}

/** Check if a user is a member of the class from an invite */
export async function userIsMemberInvite(req: AuthenticatedRequest): Promise<Result<RequestCheckError>> {
    const result = await db.userIsMemberInvite(
        req.params.invite,
        req.user.emails[0].value
    );

    if (result.ok && result.value) {
        return new Result(true, { msg: 'already a member of the class' });
    }
    return new Result(result.ok);
}


// Middleware Options
// --------------------------------------------
export const schema: Schema = {
    params: {
        class: [ core.shortName ],
    },
    checks: [classAuth],
};

export const ownerSchema: Schema = {
    params: {
        class: [ core.shortName ],
    },
    checks: [classAuth, isNotOwner],
};

export const postSchema: Schema = {
    body: {
        shortName: {
            required: true,
            type: 'text',
            checks: [ core.shortName ],
        },
        name: {
            required: true,
            type: 'text',
        },
        description: {
            required: false,
            type: 'text',
        },
    },
    checks: [exists],
};

export const putSchema: Schema = {
    ...postSchema,
    params: {
        class: [ core.shortName ],
    },
    checks: [classAuth, isNotOwner, putShortNameExists],
};

export const avatarSchema: Schema = {
    ...ownerSchema,
    file: {
        mimetype: ['image/jpeg', 'image/png'],
    },
};

export const deleteMemberSchema: Schema = {
    params: {
        class: [ core.shortName ],
        user: [ core.uuid ],
    },
    checks: [
        classAuth,
        isNotOwner,
        userIsNotMember,
        memberIsOwner,
    ],
};

export const inviteSchema: Schema = {
    params: {
        invite: [ core.uuid ],
    },
    checks: [invalidInvite],
};

export const postInviteSchema: Schema = {
    params: {
        invite: [ core.uuid ],
    },
    checks: [invalidInvite, userIsMemberInvite],
};
