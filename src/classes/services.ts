import { promises as fs } from 'fs';
import logger from 'src/logger';
import Result from 'src/common/result';
import { User, Class, Invite } from 'src/api/types';
import { convertDBToAPI as convertUserDBToAPI } from 'src/users/services';
import { rmWorkDir } from 'src/work/services';
import * as avatar from './avatars';
import * as db from './db';

// Helpers
// --------------------------------------------
export async function exists(shortName: string): Promise<Result<boolean>> {
    return await db.exists(shortName);
}


// Invites
// --------------------------------------------
/** Duration an invite will work for before expiring, in milliseconds */
export const inviteDuration = 1000 * 60 * 60 * 24 * 7;

function getInviteUrl(uuid: string): string {
    return `/invite/${uuid}`;
}


// Create
// --------------------------------------------
interface CreateClass {
    shortName: string;
    ownerEmail: string;
    name: string;
    description?: string;
}

/** Create a new Class */
export async function create(cl: CreateClass): Promise<Result> {
    const created = await db.create({ ...cl, 
        avatarMimetype: avatar.defaultFile.mimetype,
    });

    if (created.ok) avatar.addDefault(cl.shortName);
    return created;
}

export async function createInvite(shortName: string): Promise<Result<string>> {
    const invite = await db.insertInvite(shortName);

    if (invite.ok && invite.value) {
        return new Result(true, getInviteUrl(invite.value));
    }
    return new Result(false);
}

export async function acceptInvite(uuid: string, email: string): Promise<Result> {
    return await db.acceptInvite(uuid, email);
}


// Read
// --------------------------------------------
export function convertDBToAPI(cl: db.Class): Class {
    return {
        shortName: cl.shortName,
        ownerUUID: cl.ownerUUID,
        name: cl.name,
        ...(cl.description ? { description: cl.description } : {}),
        avatarUrl: avatar.getPath(
            cl.shortName,
            cl.avatarMimetype,
            true
        ),
        isOwner: cl.isOwner,
        members: cl.members,
        assignments: cl.assignments,
    };
}

export async function getAll(email: string): Promise<Result<Class[]>> {
    const cls = await db.getClasses(email);

    if (cls.ok && cls.value) {
        return new Result(true, cls.value.map(convertDBToAPI));
    }
    return new Result(false);
}

export async function get(className: string, email: string): Promise<Result<Class>> {
    const cl = await db.get(className, email);

    if (cl.ok && cl.value) {
        return new Result(true, convertDBToAPI(cl.value));
    }
    return new Result(false);
}

export async function members(shortName: string): Promise<Result<User[]>> {
    const dbMembers = await db.members(shortName);

    if (dbMembers.ok && dbMembers.value) {
        return new Result(true, dbMembers.value.map(convertUserDBToAPI));
    }
    return new Result(false);
}

function convertInviteDBToAPI(invite: db.Invite): Invite {
    const createTimeMs = new Date(invite.createTime).valueOf();
    const expiryTime = new Date(createTimeMs + inviteDuration).toISOString();
    return {
        uuid: invite.uuid,
        inviteUrl: getInviteUrl(invite.uuid),
        expiryTime,
        class: {
            shortName: invite.classShortName,
            name: invite.className,
            avatarUrl: avatar.getPath(
                invite.classShortName,
                invite.classAvatarMimetype,
                true
            ),
            members: invite.members,
            assignments: invite.assignments,
            isMember: invite.isMember,
        },
    };
}

export async function getInvite(uuid: string, email: string): Promise<Result<Invite>> {
    const dbInvite = await db.getInvite(uuid, email);

    if (dbInvite.ok && dbInvite.value) {
        return new Result(true, convertInviteDBToAPI(dbInvite.value));
    }
    return new Result(false);
}


// Update
// --------------------------------------------
export async function update(cl: db.UpdateClass, className: string): Promise<Result> {
    const updated = await db.update(cl, className);

    if (updated.ok && updated.value) {
        await avatar.updateShortName(className, cl.shortName, updated.value);
        return new Result(true);
    }
    return new Result(false);
}

export async function updateAvatar(file: Express.Multer.File, className: string): Promise<Result> {
    const oldMimetype = await db.avatarMimetype(className);

    if (oldMimetype.ok && oldMimetype.value) {
        try {
            // Update avatar
            await fs.rename(file.path, avatar.getPath(className, file.mimetype));
            const updated = await db.updateAvatarMimetype(file.mimetype, className);

            if (updated.ok) {
                // Remove old avatar
                if (oldMimetype.value !== file.mimetype) {
                    await avatar.remove(className, oldMimetype.value);
                }
                return new Result(true);
            }
            return new Result(false);
        } catch (e) {
            logger.error(e);

            // Remove file upload
            try { await fs.unlink(file.path); }
            catch (e) { logger.error(e); }
        }
    }
    return new Result(false);
}


// Delete
// --------------------------------------------
export async function del(className: string): Promise<Result> {
    const workUUIDs = await db.workUUIDs(className);
    const deleted = await db.del(className);

    if (deleted.ok && deleted.value) {
        await avatar.remove(className, deleted.value);

        if (workUUIDs.ok && workUUIDs.value) {
            for (const uuid of workUUIDs.value) {
                rmWorkDir(uuid);
            } 
        }

        return new Result(true);
    }
    return new Result(false);
}

export async function deleteMember(className: string, userUUID: string): Promise<Result> {
    return await db.deleteMember(className, userUUID);
}
