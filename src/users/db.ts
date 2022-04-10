import { QueryResult } from 'pg';
import pool from 'src/db';
import Result from 'src/common/result';
import logger from 'src/logger';
import { User as APIUser, Me as APIMe } from 'src/api/types';

// Types
// --------------------------------------------
export type AvatarMimetype = 'image/png' | 'image/jpeg';

export interface User extends Omit<APIUser, 'avatarUrl'> {
    avatarMimetype: AvatarMimetype;
}

export interface Me extends Omit<APIMe, 'avatarUrl'> {
    avatarMimetype: AvatarMimetype;
}

export interface InsertUser {
    email: string;
    fname: string;
    lname: string;
    avatarMimetype: AvatarMimetype;
}

export interface UpdateMe {
    email: string;
    firstName: string;
    lastName: string;
}


// Validation
// --------------------------------------------
/** Check a users exists with email */
export async function exists(email: string): Promise<Result<boolean>> {
    try {
        const { rows } = await pool.query(
            'SELECT userID FROM usr WHERE email = $1',
            [email]
        );

        return new Result(true, rows.length === 1);
    } catch (err) {
        logger.error(err);
        return new Result(false);
    }
}

/** Check a users exists with UUID */
export async function existsUUID(uuid: string): Promise<Result<boolean>> {
    try {
        const { rows } = await pool.query(
            'SELECT userID FROM usr WHERE uuid = $1',
            [uuid]
        );

        return new Result(true, rows.length === 1);
    } catch (err) {
        logger.error(err);
        return new Result(false);
    }
}


// Create
// --------------------------------------------
/** Insert a new User */
export async function insert(user: InsertUser): Promise<Result<string>> {
    try {
        const { rows }: QueryResult<{ uuid: string }> = await pool.query(
            `INSERT INTO usr (email, fname, lname, avatar_mimetype)
            VALUES ($1, $2, $3, $4) RETURNING uuid`,
            [user.email, user.fname, user.lname, user.avatarMimetype]
        );

        return new Result(true, rows[0].uuid);
    } catch (err) {
        logger.error(err);
        return new Result(false);
    }
}


// Read
// --------------------------------------------
/** Get a user */
export async function get(uuid: string): Promise<Result<User>> {
    try {
        const { rows }: QueryResult<User> = await pool.query(
            `SELECT
                uuid,
                fname as "firstName",
                lname as "lastName",
                avatar_mimetype as "avatarMimetype"
            FROM usr WHERE uuid = $1`,
            [uuid]
        );

        return new Result(true, rows[0]);
    } catch (err) {
        logger.error(err);
        return new Result(false);
    }
}

/** Get a user's UUID from their email */
export async function uuid(email: string): Promise<Result<string>> {
    try {
        const { rows }: QueryResult<{ uuid: string }> = await pool.query(
            'SELECT uuid FROM usr WHERE email = $1',
            [email]
        );

        return new Result(true, rows[0].uuid);
    } catch (err) {
        logger.error(err);
        return new Result(false);
    }
}

/** Get a user's avatar type */
export async function avatarType(uuid: string): Promise<Result<AvatarMimetype>> {
    try {
        const { rows }: QueryResult<{ mimetype: AvatarMimetype }> = await pool.query(
            'SELECT avatar_mimetype as "mimetype" FROM usr WHERE uuid = $1',
            [uuid]
        );

        return new Result(true, rows[0].mimetype);
    } catch (err) {
        logger.error(err);
        return new Result(false);
    }
}

/** Get data for a user on their own account */
export async function getMe(email: string): Promise<Result<Me>> {
    try {
        const { rows }: QueryResult<Me> = await pool.query(
            `SELECT
                u.uuid,
                u.fname as "firstName",
                u.lname as "lastName",
                u.avatar_mimetype as "avatarMimetype",
                (
                    SELECT COUNT(workID) FROM work WHERE userID = u.userID
                ) as "assignmentsCompleted",
                COUNT(a.assignmentID) as "assignmentCount",
                (
                    SELECT ROUND(COALESCE(
                        AVG(rating::decimal / asgmnt.rating_max::decimal),
                        0
                    ), 2) FROM review r
                    INNER JOIN work w ON w.workID=r.workID
                    INNER JOIN assignment asgmnt ON asgmnt.assignmentID=w.assignmentID
                    WHERE w.userID = u.userID
                ) as "averageFeedbackRating",
                (
                    SELECT COUNT(workID) FROM review WHERE userID = u.userID
                ) as "reviewsCompleted",
                COALESCE(SUM(a.min_reviews), 0) as "totalMinReviews",
                (
                    SELECT COALESCE(COUNT(*),0) FROM review_like
                    WHERE reviewerID = u.userID AND is_like IS TRUE
                ) as "totalReviewLikes",
                (
                    SELECT COALESCE(COUNT(*),0) FROM review_like
                    WHERE reviewerID = u.userID AND is_like IS FALSE
                ) as "totalReviewDislikes"
            FROM usr u
            LEFT JOIN class_usr cu ON cu.userID=u.userID
            LEFT JOIN class c ON c.classID=cu.classID
            LEFT JOIN assignment a ON a.classID=c.classID
            WHERE u.email = $1
            GROUP BY u.userID`,
            [email]
        );

        return new Result(true, rows[0]);
    } catch (err) {
        logger.error(err);
        return new Result(false);
    }
}


// Update
// --------------------------------------------
export async function updateMe(me: UpdateMe): Promise<Result> {
    try {
        const { rowCount } = await pool.query(
            'UPDATE usr SET fname = $1, lname = $2 WHERE email = $3',
            [me.firstName, me.lastName, me.email]
        );

        return new Result(rowCount === 1);
    } catch (err) {
        logger.error(err);
        return new Result(false);
    }
}

export async function updateAvatarMimetype(mimetype: string, uuid: string): Promise<Result> {
    try {
        await pool.query(
            `UPDATE usr SET avatar_mimetype = $1 WHERE uuid = $2`,
            [mimetype, uuid]
        );

        return new Result(true);
    } catch (err) {
        logger.error(err);
        return new Result(false);
    }
}


// Delete
// --------------------------------------------
interface DeletedUser {
    uuid: string;
    avatarMimetype: AvatarMimetype;
}

export async function del(email: string): Promise<Result<DeletedUser>> {
    try {
        const { rows }: QueryResult<DeletedUser> = await pool.query(
            `DELETE FROM usr WHERE email = $1
            RETURNING uuid, avatar_mimetype AS "avatarMimetype"`,
            [email]
        );

        if (rows.length > 0) {
            return new Result(true, rows[0]);
        }
        return new Result(false);
    } catch (err) {
        logger.error(err);
        return new Result(false);
    }
}

interface DeletedClass {
    shortName: string;
    avatarMimetype: AvatarMimetype;
}

/**
 * Get class short names and avatar mimetypes to delete their avatar files
 * when cascade deleting from a user.
 */
export async function classesToCascadeDelete(email: string): Promise<Result<DeletedClass[]>> {
    try {
        const { rows }: QueryResult<DeletedClass> = await pool.query(
            `SELECT
                c.short_name as "shortName",
                c.avatar_mimetype as "avatarMimetype"
            FROM class c
            INNER JOIN usr u ON u.userID=c.ownerID
            WHERE u.email = $1`,
            [email]
        );

        return new Result(true, rows);
    } catch (err) {
        logger.error(err);
        return new Result(false);
    }
}

/** Get work UUIDS to delete their files when cascade deleting from a user */
export async function workToCascadeDelete(email: string): Promise<Result<string[]>> {
    try {
        const { rows }: QueryResult<{ uuid: string }> = await pool.query(
            `(
                SELECT w.uuid FROM work w
                INNER JOIN usr u ON u.userID=w.userID
                WHERE u.email = $1
            ) UNION (
                SELECT w.uuid FROM work w
                INNER JOIN assignment a ON a.assignmentID=w.assignmentID
                INNER JOIN class c ON c.classID=a.classID
                INNER JOIN usr u ON u.userID=c.ownerID
                WHERE u.email = $1
            )`,
            [email]
        );

        return new Result(true, rows.map(row => row.uuid));
    } catch (err) {
        logger.error(err);
        return new Result(false);
    }
}
