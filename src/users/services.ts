import { promises as fs } from 'fs';
import { GoogleProfile } from 'simple-google-openid';
import logger from 'src/logger';
import Result from 'src/common/result';
import { Me, User } from 'src/api/types';
import { remove as removeClassAvatar } from 'src/classes/avatars';
import { rmWorkDir } from 'src/work/services';
import * as avatar from './avatars';
import * as db from './db';

// Create
// --------------------------------------------
/** Creates a new user */
export async function create(user: GoogleProfile): Promise<Result<string>> {
    const uuid = await db.insert({
        email: user.emails[0].value,
        fname: user.name.givenName,
        lname: user.name.familyName,
        avatarMimetype: avatar.defaultFile.mimetype,
    });

    if (uuid.ok && uuid.value) avatar.addDefault(uuid.value);
    return uuid;
}


// Read
// --------------------------------------------
export function convertDBToAPI(user: db.User): User {
    return {
        uuid: user.uuid,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: avatar.getPath(
            user.uuid,
            user.avatarMimetype,
            true
        ),
    };
}

export async function get(uuid: string): Promise<Result<User>> {
    const user = await db.get(uuid);

    if (user.ok && user.value) {
        return new Result(true, convertDBToAPI(user.value));
    }
    return new Result(false);
}

export async function getMe(email: string): Promise<Result<Me>> {
    const me = await db.getMe(email);

    if (me.ok && me.value) {
        return new Result(true, {
            ...convertDBToAPI(me.value),
            assignmentsCompleted: me.value.assignmentsCompleted,
            assignmentCount: me.value.assignmentCount,
            averageFeedbackRating: me.value.averageFeedbackRating,
            reviewsCompleted: me.value.reviewsCompleted,
            totalMinReviews: me.value.totalMinReviews,
            totalReviewLikes: me.value.totalReviewLikes,
            totalReviewDislikes: me.value.totalReviewDislikes,
        });
    }
    return new Result(false);
}

export async function exists(email: string): Promise<Result<boolean>> {
    return await db.exists(email);
}

export async function getMeAvatar(email: string): Promise<Result<string>> {
    const uuid = await db.uuid(email);

    if (uuid.ok && uuid.value) {
        return getAvatar(uuid.value);
    }
    return new Result(false);
}

export async function getAvatar(uuid: string): Promise<Result<string>> {
    const type = await db.avatarType(uuid);

    if (type.ok && type.value) {
        return new Result(true, avatar.getPath(uuid, type.value, true));
    }
    return new Result(false);
}


// Update
// --------------------------------------------
export async function updateMe(me: db.UpdateMe): Promise<Result> {
    return await db.updateMe(me);
}

export async function updateMeAvatar(file: Express.Multer.File, email: string): Promise<Result> {
    const uuid = await db.uuid(email);

    if (uuid.ok && uuid.value) {
        return updateAvatar(file, uuid.value);
    }
    return new Result(false);
}

export async function updateAvatar(file: Express.Multer.File, uuid: string): Promise<Result> {
    const staleType = file.mimetype === 'image/png' ? 'image/jpg': 'image/png';

    try {
        await fs.rename(file.path, avatar.getPath(uuid, file.mimetype));
        const mimetypeUpdate = await db.updateAvatarMimetype(file.mimetype, uuid);

        if (mimetypeUpdate.ok) {
            await avatar.remove(uuid, staleType);
            return new Result(true);
        }
        return new Result(false);
    } catch (e) {
        logger.error(e);

        try { await fs.unlink(file.path); }
        catch (e) { logger.warn(e); }

        return new Result(false);
    }
}


// Delete
// --------------------------------------------
export async function del(email: string): Promise<Result> {
    const classes = await db.classesToCascadeDelete(email);
    const work = await db.workToCascadeDelete(email);
    const deleted = await db.del(email);

    if (deleted.ok && deleted.value) {
        await avatar.remove(deleted.value.uuid, deleted.value.avatarMimetype);

        if (classes.ok && classes.value) {
            for (const cl of classes.value) {
                removeClassAvatar(cl.shortName, cl.avatarMimetype);
            } 
        }

        if (work.ok && work.value) {
            for (const uuid of work.value) {
                rmWorkDir(uuid);
            } 
        }

        return new Result(true);
    }
    return new Result(false);
}
