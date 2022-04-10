import { QueryResult } from 'pg';
import pool from 'src/db';
import logger from 'src/logger';
import Result from 'src/common/result';
import { AvatarMimetype } from 'src/users/db';

// Types
// --------------------------------------------
export interface Review {
    userUUID: string;
    firstName: string;
    lastName: string;
    avatarMimetype: AvatarMimetype;
    rating: number;
    feedback: string;
    liked?: boolean;
    createTime: string;
}

export interface InsertReview {
    rating: number;
    feedback: string;
}

export interface InsertReviewLike {
    userEmail: string;
    reviewerUUID: string;
    workUUID: string;
    isLike: boolean;
}


// Validation
// --------------------------------------------
/** 
 * Check a user can access a given review.
 * The user must be the owner of the work being reviewed and the review must exist.
 */
export async function userCanAccess(workUUID: string, reviewerUUID: string, email: string): Promise<Result<boolean>> {
    try {
        const { rows } = await pool.query(
            `SELECT r.userID FROM review r
            INNER JOIN usr ru ON ru.userID=r.userID
            INNER JOIN work w ON w.workID=r.workID
            INNER JOIN usr u ON u.userID=w.userID
            WHERE w.uuid = $1 AND ru.uuid = $2 AND u.email = $3`,
            [workUUID, reviewerUUID, email]
        );

        return new Result(true, rows.length === 1);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}

/** Check a review exists */
export async function exists(uuid: string, email: string): Promise<Result<boolean>>{
    try {
        const { rows } = await pool.query(
            `SELECT r.userID FROM review r
            INNER JOIN usr u ON u.userID=r.userID
            INNER JOIN work w ON w.workID=r.workID
            WHERE w.uuid = $1 AND u.email = $2`,
            [uuid, email]
        );

        return new Result(true, rows.length === 1);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}


// Create
// --------------------------------------------
export async function insert(uuid: string, review: InsertReview, email: string): Promise<Result> {
    try {
        await pool.query(
            `INSERT INTO review (userID, workID, rating, feedback) VALUES (
                ( SELECT userID FROM usr WHERE email = $1 ),
                ( SELECT workID FROM work WHERE uuid = $2 ),
                $3,
                $4
            )`,
            [email, uuid, review.rating, review.feedback]
        );

        return new Result(true);
    } catch (err) {
        logger.error(err);
        return new Result(false);
    }
}

export async function like(reviewLike: InsertReviewLike): Promise<Result> {
    try {
        await pool.query(
            `INSERT INTO review_like (userID, reviewerID, workID, is_like)
            VALUES (
                ( SELECT userID FROM usr WHERE email = $1 ),
                ( SELECT userID FROM usr WHERE uuid = $2 ),
                ( SELECT workID FROM work WHERE uuid = $3 ),
                $4
            ) 
            ON CONFLICT (userID, reviewerID, workID) DO 
               UPDATE SET is_like = $4`,
            [
                reviewLike.userEmail,
                reviewLike.reviewerUUID,
                reviewLike.workUUID,
                reviewLike.isLike ? 'TRUE' : 'FALSE',
            ]
        );

        return new Result(true);
    } catch (err) {
        logger.error(err);
        return new Result(false);
    }
}


// Read
// --------------------------------------------
export async function getAll(uuid: string, email: string): Promise<Result<Review[]>> {
    try {
        const { rows }: QueryResult<Review> = await pool.query(
            `SELECT
                u.uuid as "userUUID",
                u.fname as "firstName",
                u.lname as "lastName",
                u.avatar_mimetype as "avatarMimetype",
                r.rating,
                r.feedback,
                (
                    SELECT is_like FROM review_like rl
                    INNER JOIN usr ON usr.userID=rl.userID
                    WHERE usr.email = $1 AND
                        rl.reviewerID = u.userID AND
                        rl.workID = w.workID
                ) as "liked",
                r.create_time as "createTime"
            FROM review r
            INNER JOIN work w ON w.workID=r.workID
            INNER JOIN usr u ON u.userID=r.userID
            WHERE w.uuid = $2`,
            [email, uuid]
        );

        return new Result(true, rows);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}


// Delete
// --------------------------------------------
export async function deleteLike(workUUID: string, reviewerUUID: string, email: string): Promise<Result> {
    try {
        await pool.query(
            `DELETE FROM review_like WHERE
            userID = (SELECT userID FROM usr WHERE email = $1) AND
            reviewerID = (SELECT userID FROM usr WHERE uuid = $2) AND
            workID = (SELECT workID FROM work WHERE uuid = $3)`,
            [email, reviewerUUID, workUUID]
        );

        return new Result(true);
    } catch (err) {
        logger.error(err);
        return new Result(false);
    }
}
