import { AuthenticatedRequest, Request } from 'express';
import Result from 'src/common/result';
import { core, Schema, RequestCheckError } from 'src/validation';
import { userCanAccess as userCanAccessAsgmnt, passedDeadline as asgmntPassedDeadline } from 'src/assignments/db';
import * as db from './db';

// Authorisation
// --------------------------------------------
/**
 * Check the existence of and if the user can access one of their work submissions
 * @returns True if the user isn't the owner or the work doesn't exist
 */
export async function workOwnerAuth(req: AuthenticatedRequest): Promise<Result<RequestCheckError>> {
    const result = await db.userIsOwner(
        req.params.work,
        req.user.emails[0].value
    );

    if (result.ok && !result.value) {
        return new Result(true, {
            code: 404,
            msg: 'work submission does not exist',
        });
    }
    return new Result(result.ok);
}

/**
 * Check the existence of a work submission and if the user is in the same class
 * @returns True if the user isn't in the same class or the work doesn't exist
 */
export async function workClassAuth(req: AuthenticatedRequest): Promise<Result<RequestCheckError>> {
    const result = await db.workFromClass(
        req.params.work,
        req.user.emails[0].value
    );

    if (result.ok && !result.value) {
        return new Result(true, {
            code: 404,
            msg: 'work submission does not exist',
        });
    }
    return new Result(result.ok);
}

/** Assignment authorisation using values from req body */
export async function asgmntAuth(req: AuthenticatedRequest): Promise<Result<RequestCheckError>> {
    const result = await userCanAccessAsgmnt(
        req.body.asgmntName,
        req.body.className,
        req.user.emails[0].value
    );

    if (result.ok && !result.value) {
        return new Result(true, {
            code: 404,
            msg: 'assignment does not exist',
        });
    }
    return new Result(result.ok);
}


// Validation
// --------------------------------------------
/** Check if the user is the owner of a work submission */
export async function isOwner(req: AuthenticatedRequest): Promise<Result<RequestCheckError>> {
    const result = await db.userIsOwner(
        req.params.work,
        req.user.emails[0].value
    );

    if (result.ok && result.value) {
        return new Result(true, { msg: 'cannot be the owner of the work submission' });
    }
    return new Result(result.ok);
}

/** Check if assignment deadline has passed */
async function postPassedDeadline(req: Request): Promise<Result<RequestCheckError>> {
    const result = await asgmntPassedDeadline(
        req.body.asgmntName,
        req.body.className
    );

    if (result.ok && result.value) {
        return new Result(true, { msg: 'deadline passed' });
    }
    return new Result(result.ok);
}

/** Check if assignment already has work submitted */
async function exists(req: AuthenticatedRequest): Promise<Result<RequestCheckError>> {
    const result = await db.exists(
        req.body.asgmntName,
        req.body.className,
        req.user.emails[0].value
    );

    if (result.ok && result.value) {
        return new Result(true, { msg: 'work submission exists' });
    }
    return new Result(result.ok);
}

/** Check if assignment deadline has passed */
async function passedDeadline(req: Request): Promise<Result<RequestCheckError>> {
    const result = await db.passedDeadline(req.params.work);

    if (result.ok && result.value) {
        return new Result(true, { msg: 'deadline passed' });
    }
    return new Result(result.ok);
}

/** Check if assignment deadline is in the future */
export async function futureDeadline(req: Request): Promise<Result<RequestCheckError>> {
    const result = await db.futureDeadline(req.params.work);

    if (result.ok && result.value) {
        return new Result(true, { msg: 'deadline has not passed yet' });
    }
    return new Result(result.ok);
}

/** Check if assignment reviews deadline has passed */
export async function passedReviewsDeadline(req: Request): Promise<Result<RequestCheckError>> {
    const result = await db.passedReviewsDeadline(req.params.work);

    if (result.ok && result.value) {
        return new Result(true, { msg: 'reviews deadline passed' });
    }
    return new Result(result.ok);
}

async function isNotPdf(req: Request): Promise<Result<RequestCheckError>> {
    const result = await db.type(req.params.work);

    if (result.ok && result.value !== 'pdf') {
        return new Result(true, { msg: 'work type is not pdf' });
    }
    return new Result(result.ok);
}


// Middleware Options
// --------------------------------------------
export const schema: Schema = {
    params: {
        work: [ core.uuid ],
    },
    checks: [workOwnerAuth],
};

export const postSchema: Schema = {
    body: {
        className: {
            required: true,
            type: 'text',
            checks: [ core.shortName ],
        },
        asgmntName: {
            required: true,
            type: 'text',
            checks: [ core.shortName ],
        },
        type: {
            required: true,
            type: 'text',
            enum: ['pdf', 'url'],
        },
        filename: {
            type: 'text',
            required: {
                field: 'type',
                value: 'pdf',
            },
        },
        url: {
            type: 'text',
            required: {
                field: 'type',
                value: 'url',
            },
            checks: [ core.url ],
        },
    },
    checks: [
        asgmntAuth,
        postPassedDeadline,
        exists,
    ],
};

export const updateSchema: Schema = {
    params: {
        work: [ core.uuid ],
    },
    body: {
        type: {
            required: true,
            type: 'text',
            enum: ['pdf', 'url'],
        },
        filename: {
            type: 'text',
            required: {
                field: 'type',
                value: 'pdf',
            },
        },
        url: {
            type: 'text',
            required: {
                field: 'type',
                value: 'url',
            },
            checks: [ core.url ],
        },
    },
    checks: [workOwnerAuth, passedDeadline],
};

export const pdfSchema: Schema = {
    params: {
        work: [ core.uuid ],
    },
    file: { mimetype: 'application/pdf' },
    checks: [workOwnerAuth, passedDeadline, isNotPdf],
};
