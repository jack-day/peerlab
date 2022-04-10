import { QueryResult } from 'pg';
import pool from 'src/db';
import logger from 'src/logger';
import Result from 'src/common/result';
import { Class as APIClass } from 'src/api/types';
import { User } from 'src/users/db';

// Types
// --------------------------------------------
export type AvatarMimetype = 'image/png' | 'image/jpeg';

export interface Class extends Omit<APIClass, 'avatarUrl'> {
    avatarMimetype: AvatarMimetype;
}

export interface InsertClass {
    shortName: string;
    ownerEmail: string;
    name: string;
    description?: string;
    avatarMimetype: AvatarMimetype;
}

export interface UpdateClass {
    shortName: string;
    ownerEmail: string;
    name: string;
    description?: string;
}

export interface Invite {
    uuid: string;
    createTime: string;
    classShortName: string;
    className: string;
    classAvatarMimetype: AvatarMimetype;
    members: number;
    assignments: number;
    isMember: boolean;
}


// Validation
// --------------------------------------------
/**
 * Check a user can access a given class
 * by checking it exists and they are a member of the class
 */
export async function userCanAccess(className: string, email: string): Promise<Result<boolean>> {
    try {
        const { rows } = await pool.query(
            `SELECT cu.userID FROM class_usr cu 
            INNER JOIN usr u ON u.userID=cu.userID
            INNER JOIN class c ON c.classID=cu.classID
            WHERE c.short_name = $1 AND u.email = $2`,
            [className, email]
        );

        return new Result(true, rows.length === 1);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}

/** Check a user is the owner of a given class */
export async function userIsOwner(className: string, email: string): Promise<Result<boolean>> {
    try {
        const { rows } = await pool.query(
            `SELECT ownerID FROM class c
            INNER JOIN usr u ON u.userID=c.ownerID
            WHERE c.short_name = $1 AND u.email = $2`,
            [className, email]
        );

        return new Result(true, rows.length === 1);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}

/** Check a user is a member of a given class from their UUID */
export async function userIsMember(className: string, userUUID: string): Promise<Result<boolean>> {
    try {
        const { rows } = await pool.query(
            `SELECT cu.userID FROM class_usr cu 
            INNER JOIN usr u ON u.userID=cu.userID
            INNER JOIN class c ON c.classID=cu.classID
            WHERE c.short_name = $1 AND u.uuid = $2`,
            [className, userUUID]
        );

        return new Result(true, rows.length === 1);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}

/** Check a user is the owner of a given class using their UUID */
export async function userIsOwnerUUID(className: string, userUUID: string): Promise<Result<boolean>> {
    try {
        const { rows } = await pool.query(
            `SELECT ownerID FROM class c
            INNER JOIN usr u ON u.userID=c.ownerID
            WHERE c.short_name = $1 AND u.uuid = $2`,
            [className, userUUID]
        );

        return new Result(true, rows.length === 1);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}

/** Check an invite exists */
export async function inviteExists(uuid: string): Promise<Result<boolean>> {
    try {
        const { rows } = await pool.query(
            `SELECT class_inviteUUID FROM class_invite
            WHERE class_inviteUUID = $1`,
            [uuid]
        );

        return new Result(true, rows.length === 1);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}

/** Check a user is a member of a given class from an invite */
export async function userIsMemberInvite(inviteUUID: string, email: string): Promise<Result<boolean>> {
    try {
        const { rows } = await pool.query(
            `SELECT cu.userID FROM class_usr cu
            INNER JOIN usr u ON u.userID=cu.userID
            INNER JOIN class c ON c.classID=cu.classID
            WHERE u.email = $1 AND c.classID = (
                SELECT classID FROM class_invite WHERE class_inviteUUID = $2
            )`,
            [email, inviteUUID]
        );

        return new Result(true, rows.length === 1);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}


// Helpers
// --------------------------------------------
/** Check a class exists */
export async function exists(className: string): Promise<Result<boolean>> {
    try {
        const { rows } = await pool.query(
            'SELECT short_name FROM class WHERE short_name = $1',
            [className]
        );

        return new Result(true, rows.length === 1);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}


// Create
// --------------------------------------------
/** Insert a new Class */
export async function create(cl: InsertClass): Promise<Result> {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        // Insert Class
        const { rows }: QueryResult<{ classid: number }> = await client.query(
            `INSERT INTO class
            (ownerID, short_name, name, description, avatar_mimetype)
            VALUES ((SELECT userID FROM usr WHERE email=$1), $2, $3, $4, $5)
            RETURNING classID`,
            [
                cl.ownerEmail,
                cl.shortName,
                cl.name,
                cl.description,
                cl.avatarMimetype,
            ]
        );

        // Link class to current user
        await client.query(
            `INSERT INTO class_usr (userID, classID)
            VALUES ((SELECT userID FROM usr WHERE email=$1), $2)`,
            [cl.ownerEmail, rows[0].classid]
        );

        await client.query('COMMIT');
        return new Result(true);

    } catch (e) {
        await client.query('ROLLBACK');
        logger.error(e);
        return new Result(false);

    } finally {
        client.release();
    }
}

/** Insert a new class invite */
export async function insertInvite(className: string): Promise<Result<string>> {
    try {
        const { rows }: QueryResult<{ uuid: string }> = await pool.query(
            `INSERT INTO class_invite (classID)
            VALUES ((SELECT classID FROM class WHERE short_name = $1))
            RETURNING class_inviteUUID as "uuid"`,
            [className]
        );

        return new Result(true, rows[0].uuid);
    } catch (err) {
        logger.error(err);
        return new Result(false);
    }
}

/** Accept a class invite and insert a user into the class */
export async function acceptInvite(uuid: string, email: string): Promise<Result> {
    try {
        await pool.query(
            `INSERT INTO class_usr (userID, classID)
            VALUES (
                (SELECT userID FROM usr WHERE email = $1),
                (SELECT classID FROM class_invite WHERE class_inviteUUID = $2)
            )`,
            [email, uuid]
        );

        return new Result(true);
    } catch (err) {
        logger.error(err);
        return new Result(false);
    }
}


// Read
// --------------------------------------------
const getQuery =`SELECT
c.short_name as "shortName",
(SELECT uuid FROM usr WHERE userID=c.ownerID) as "ownerUUID",
c.name,
c.description,
c.avatar_mimetype as "avatarMimetype",
(
    CASE WHEN u.userID = c.ownerID THEN
        TRUE
    ELSE
        FALSE
    END
) AS "isOwner",
(
    SELECT COUNT(class.classID) FROM class
    INNER JOIN class_usr ON class_usr.classID=class.classID
    WHERE class.classID=c.classID
) AS "members",
(
    SELECT COUNT(assignmentID) FROM assignment
    INNER JOIN class ON class.classID=assignment.classID
    WHERE class.classID=c.classID
) AS "assignments"
FROM class c
INNER JOIN class_usr cu ON cu.classID=c.classID
INNER JOIN usr u ON u.userID=cu.userID`;

/** Get Classes related to a User */
export async function getClasses(email: string): Promise<Result<Class[]>> {
    if (!email) return new Result(false);

    try {
        const { rows }: QueryResult<Class> = await pool.query(
            `${getQuery} WHERE u.email = $1`,
            [email]
        );

        for (const row of rows) {
            if (!row.description) delete row.description;
        }

        return new Result(true, rows);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}

export async function get(className: string, email: string): Promise<Result<Class>> {
    try {
        
        const { rows }: QueryResult<Class> = await pool.query(
            `${getQuery} WHERE c.short_name = $1 AND u.email = $2`,
            [className, email]
        );

        if (!rows[0].description) delete rows[0].description;
        
        return new Result(true, rows[0]);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}

/** Get the avatar mimetype of a class */
export async function avatarMimetype(className: string): Promise<Result<AvatarMimetype>> {
    try {
        const { rows }: QueryResult<{ mimetype: AvatarMimetype }> = await pool.query(
            'SELECT avatar_mimetype as "mimetype" FROM class WHERE short_name = $1',
            [className]
        );

        return new Result(true, rows[0].mimetype);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}

/** Get all members of a class */
export async function members(shortName: string): Promise<Result<User[]>> {
    try {
        const { rows }: QueryResult<User> = await pool.query(
            `SELECT
                u.uuid,
                u.fname as "firstName",
                u.lname as "lastName",
                u.avatar_mimetype as "avatarMimetype"
            FROM usr u
            INNER JOIN class_usr cu ON cu.userID=u.userID
            INNER JOIN class c ON c.classID=cu.classID
            WHERE c.short_name = $1`,
            [shortName]
        );

        return new Result(true, rows);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}

/** Get all work UUIDs linked to a class through it's assignments */
export async function workUUIDs(shortName: string): Promise<Result<string[]>> {
    try {
        const { rows }: QueryResult<{ uuid: string }> = await pool.query(
            `SELECT w.uuid FROM work w
            INNER JOIN assignment a ON a.assignmentID=w.assignmentID
            INNER JOIN class c ON c.classID=a.classID
            WHERE c.short_name = $1`,
            [shortName]
        );

        return new Result(true, rows.map(row => row.uuid));
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}

/** Get class details from an invite */
export async function getInvite(uuid: string, email: string): Promise<Result<Invite>> {
    try {
        const { rows }: QueryResult<Invite> = await pool.query(
            `SELECT
                ci.class_inviteUUID as "uuid",
                ci.create_time as "createTime",
                c.short_name as "classShortName",
                c.name as "className",
                c.avatar_mimetype as "classAvatarMimetype",
                (
                    SELECT COUNT(class.classID) FROM class
                    INNER JOIN class_usr ON class_usr.classID=class.classID
                    WHERE class.classID=c.classID
                ) AS "members",
                (
                    SELECT COUNT(assignmentID) FROM assignment
                    INNER JOIN class ON class.classID=assignment.classID
                    WHERE class.classID=c.classID
                ) AS "assignments",
                (
                    CASE WHEN EXISTS (
                        SELECT cu.userID FROM class_usr cu
                        INNER JOIN usr u ON u.userID=cu.userID
                        WHERE u.email = $1 AND cu.classID = c.classID
                    ) THEN TRUE ELSE FALSE END
                ) AS "isMember"
            FROM class_invite ci
            INNER JOIN class c ON c.classID=ci.classID
            WHERE ci.class_inviteUUID = $2`,
            [email, uuid]
        );

        return new Result(true, rows[0]);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}

/** Get timestamp of when invite was created */
export async function getInviteCreateTime(uuid: string): Promise<Result<string>> {
    try {
        const { rows }: QueryResult<{ create_time: string }> = await pool.query(
            'SELECT create_time FROM class_invite WHERE class_inviteUUID = $1',
            [uuid]
        );

        if (rows.length === 1) {
            return new Result(true, rows[0].create_time);
        }
        return new Result(true);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}


// Update
// --------------------------------------------
/** Update a class, returning that class's avatar mimetype */
export async function update(cl: UpdateClass, className: string): Promise<Result<AvatarMimetype>> {
    try {
        const { rows }: QueryResult<{ avatar_mimetype: AvatarMimetype }> = await pool.query(
            `UPDATE class SET
                short_name = $1,
                name = $2,
                description = $3
            WHERE short_name = $4 RETURNING avatar_mimetype`,
            [
                cl.shortName,
                cl.name,
                cl.description,
                className,
            ]
        );

        return new Result(true, rows[0].avatar_mimetype);
    } catch (err) {
        logger.error(err);
        return new Result(false);
    }
}

/** Update a class's avatar mimetype */
export async function updateAvatarMimetype(mimetype: string, className: string): Promise<Result> {
    try {
        const { rowCount } = await pool.query(
            'UPDATE class SET avatar_mimetype = $1 WHERE short_name = $2',
            [mimetype, className]
        );

        return new Result(rowCount === 1);
    } catch (err) {
        logger.error(err);
        return new Result(false);
    }
}


// Delete
// --------------------------------------------
export async function del(className: string): Promise<Result<string>> {
    try {
        const { rows }: QueryResult<{ avatar_mimetype: string }> = await pool.query(
            `DELETE FROM class WHERE short_name = $1 RETURNING avatar_mimetype`,
            [className]
        );

        if (rows.length > 0) {
            return new Result(true, rows[0].avatar_mimetype);
        }
        return new Result(false);
    } catch (err) {
        logger.error(err);
        return new Result(false);
    }
}

export async function deleteMember(className: string, userUUID: string): Promise<Result> {
    try {
        const { rowCount } = await pool.query(
            `DELETE FROM class_usr cu WHERE
            classID = (
                SELECT classID FROM class c
                WHERE c.short_name = $1 AND c.classID = cu.classID
            ) AND
            userID = (
                SELECT userID FROM usr u
                WHERE u.uuid = $2 AND u.userID = cu.userID
            )`,
            [className, userUUID]
        );

        return new Result(rowCount === 1);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}

export async function deleteInvite(uuid: string): Promise<Result> {
    try {
        const { rowCount } = await pool.query(
            `DELETE FROM class_invite WHERE class_inviteUUID = $1`,
            [uuid]
        );

        return new Result(rowCount === 1);
    } catch (e) {
        logger.warn(e);
        return new Result(false);
    }
}
