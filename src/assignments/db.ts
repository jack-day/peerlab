import { QueryResult } from 'pg';
import pool from 'src/db';
import logger from 'src/logger';
import Result from 'src/common/result';
import { Assignment, Work } from 'src/api/types';

// Types
// --------------------------------------------
export interface InsertAsgmnt {
    shortName: string;
    name: string;
    description?: string;
    anonymous: boolean;
    minReviews?: number;
    ratingMax: number;
    deadline?: string;
    reviewsDeadline?: string;
}


// Validation
// --------------------------------------------
/** Check a user can access a given assignment */
export async function userCanAccess(asgmntName: string, className: string, email: string): Promise<Result<boolean>> {
    try {
        const { rows } = await pool.query(
            `SELECT assignmentID FROM assignment a
            INNER JOIN class c ON c.classID=a.classID
            INNER JOIN class_usr cu ON cu.classID=c.classID
            INNER JOIN usr u ON u.userID=cu.userID
            WHERE a.short_name = $1 AND c.short_name = $2 AND u.email = $3`,
            [asgmntName, className, email]
        );

        return new Result(true, rows.length === 1);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}

/** Check an assignment exists */
export async function exists(asgmntName: string, className: string): Promise<Result<boolean>>{
    try {
        const { rows } = await pool.query(
            `SELECT a.short_name FROM assignment a
            INNER JOIN class c ON c.classID=a.classID
            WHERE a.short_name = $1 AND c.short_name = $2`,
            [asgmntName, className]
        );

        return new Result(true, rows.length === 1);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}

/**
 * Check if an assignment's deadline has passed
 * @returns True if a deadline is set and it has passed
 */
export async function passedDeadline(asgmntName: string, className: string): Promise<Result<boolean>>{
    try {
        const { rows }: QueryResult<{ passed: boolean }> = await pool.query(
            `SELECT (
                deadline < CURRENT_TIMESTAMP AND deadline IS NOT NULL
            ) as passed
            FROM assignment a
            INNER JOIN class c ON c.classID=a.classID
            WHERE a.short_name = $1 AND c.short_name = $2`,
            [asgmntName, className]
        );
        
        return new Result(true, rows[0].passed);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}

/**
 * Check if assignment deadline is in the future
 * @returns True if a deadline is set and it is in the future
 */
export async function futureDeadline(asgmntName: string, className: string): Promise<Result<boolean>>{
    try {
        const { rows }: QueryResult<{ future: boolean }> = await pool.query(
            `SELECT (
                deadline IS NOT NULL AND deadline >= CURRENT_TIMESTAMP
            ) as future
            FROM assignment a
            INNER JOIN class c ON c.classID=a.classID
            WHERE a.short_name = $1 AND c.short_name = $2`,
            [asgmntName, className]
        );

        return new Result(true, rows[0].future);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}

/**
 * Check if an assignment's reviews deadline has passed
 * @returns True if a reviews deadline is set and it has passed
 */
export async function passedReviewsDeadline(asgmntName: string, className: string): Promise<Result<boolean>>{
    try {
        const { rows }: QueryResult<{ passed: boolean }> = await pool.query(
            `SELECT (
                reviews_deadline < CURRENT_TIMESTAMP AND
                reviews_deadline IS NOT NULL
            ) as passed
            FROM assignment a
            INNER JOIN class c ON c.classID=a.classID
            WHERE a.short_name = $1 AND c.short_name = $2`,
            [asgmntName, className]
        );

        return new Result(true, rows[0].passed);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}

/** Check if a user has reviewed all peer work available for the assignment */
export async function allPeersReviewed(asgmnt: string, email: string): Promise<Result<boolean>>{
    try {
        const { rows }: QueryResult<{
            peerSubmissions: number;
            reviewed: number;
        }> = await pool.query(
            `SELECT (
                SELECT COUNT(*) FROM work w
                INNER JOIN usr u ON u.userID=w.userID
                WHERE u.email != $1 AND w.assignmentID IN (
                    SELECT assignmentID FROM assignment WHERE short_name = $2
                )
            ) AS "peerSubmissions",
            (
                SELECT COUNT(*) FROM review r
                INNER JOIN usr u ON u.userID=r.userID
                INNER JOIN work w ON w.workID=r.workID
                INNER JOIN assignment a ON a.assignmentID=w.assignmentID
                WHERE u.email = $1 AND a.short_name = $2
            ) AS "reviewed"`,
            [email, asgmnt]
        );
        
        return new Result(true, rows[0].peerSubmissions <= rows[0].reviewed);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}


// Create
// --------------------------------------------
export async function insert(asgmnt: InsertAsgmnt, className: string): Promise<Result> {
    try {
        await pool.query(
            `INSERT INTO assignment (
                classID, short_name, name, description, anonymous, min_reviews,
                rating_max, deadline, reviews_deadline
            ) VALUES (
                (SELECT classID FROM class WHERE short_name = $1),
                $2, $3, $4, $5, $6, $7, $8, $9
            )`,
            [
                className,
                asgmnt.shortName,
                asgmnt.name,
                asgmnt.description,
                asgmnt.anonymous,
                asgmnt.minReviews,
                asgmnt.ratingMax,
                asgmnt.deadline,
                asgmnt.reviewsDeadline,
            ]
        );
        
        return new Result(true);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}


// Read
// --------------------------------------------
const getQuery = `SELECT
    a.short_name as "shortName",
    a.name,
    a.description,
    a.anonymous,
    a.min_reviews as "minReviews",
    a.rating_max as "ratingMax",
    a.deadline,
    a.reviews_deadline as "reviewsDeadline",
    (
        CASE WHEN u.userID = c.ownerID THEN
            TRUE
        ELSE
            FALSE
        END
    ) AS "isClassOwner",
    (
        SELECT uuid FROM work
        WHERE userID = u.userID AND assignmentID = a.assignmentID
    ) AS "workUUID",
    (
        SELECT COUNT(*) FROM work WHERE assignmentID = a.assignmentID
    ) AS "totalSubmissions",
    (
        SELECT COUNT(*) FROM review r
        INNER JOIN work w ON w.workID=r.workID
        WHERE r.userID = u.userID AND w.assignmentID = a.assignmentID
    ) AS "peersReviewed",
    (
        SELECT COALESCE(COUNT(*),0) FROM review_like rl
        INNER JOIN work w ON w.workID=rl.workID
        WHERE rl.reviewerID = u.userID AND w.assignmentID = a.assignmentID
        AND is_like IS TRUE
    ) as "totalReviewLikes",
    (
        SELECT COALESCE(COUNT(*),0) FROM review_like rl
        INNER JOIN work w ON w.workID=rl.workID
        WHERE rl.reviewerID = u.userID AND w.assignmentID = a.assignmentID
        AND is_like IS FALSE
    ) as "totalReviewDislikes"
FROM assignment a
INNER JOIN class c ON c.classID=a.classID
INNER JOIN class_usr cu ON cu.classID=c.classID
INNER JOIN usr u ON u.userID=cu.userID
`;

export async function getAll(className: string, email: string): Promise<Result<Assignment[]>> {
    try {
        const { rows } = await pool.query(
            `${getQuery} WHERE c.short_name = $1 AND u.email = $2`,
            [className, email]
        );

        return new Result(true, rows);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}

export async function get(asgmntName: string, className: string, email: string): Promise<Result<Assignment>> {
    try {
        const { rows } = await pool.query(
            `${getQuery} WHERE a.short_name = $1 AND
            c.short_name = $2 AND u.email = $3`,
            [asgmntName, className, email]
        );

        return new Result(true, rows[0]);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}

/** Get work of other class members to review */
export async function getPeerWork(asgmntName: string, className: string, email: string): Promise<Result<Work>> {
    try {
        const { rows }: QueryResult<Work> = await pool.query(
            `SELECT
                w.uuid,
                (
                    CASE WHEN a.anonymous = FALSE THEN
                        u.uuid
                    END
                ) as "userUUID",
                w.type,
                w.value as "url",
                w.upload_time as "uploadTime"
            FROM work w
            INNER JOIN usr u ON u.userID=w.userID
            INNER JOIN assignment a ON a.assignmentID=w.assignmentID
            INNER JOIN class c ON c.classID=a.classID
            WHERE
                a.short_name = $1 AND
                c.short_name = $2 AND
                u.email != $3 AND
                w.workID NOT IN (
                    SELECT workID FROM review r
                    INNER JOIN usr u ON u.userID=r.userID
                    WHERE u.email = $3
                )
            ORDER BY
                (SELECT COUNT(*) FROM review WHERE workID=w.workID) ASC,
                RANDOM()
            LIMIT 1`,
            [asgmntName, className, email]
        );

        if (rows[0] && rows[0].userUUID === null) {
            delete rows[0].userUUID;
        }

        return new Result(true, rows[0]);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}


// Update
// --------------------------------------------
export async function update(asgmnt: InsertAsgmnt, asgmntName: string, className: string): Promise<Result> {
    try {
        const { rowCount } = await pool.query(
            `UPDATE assignment SET
                short_name = $1,
                name = $2,
                description = $3,
                anonymous = $4,
                min_reviews = $5,
                rating_max = $6,
                deadline = $7,
                reviews_deadline = $8
            WHERE short_name = $9 AND
            classID = (SELECT classID FROM class WHERE short_name = $10)`,
            [
                asgmnt.shortName,
                asgmnt.name,
                asgmnt.description,
                asgmnt.anonymous,
                asgmnt.minReviews,
                asgmnt.ratingMax,
                asgmnt.deadline,
                asgmnt.reviewsDeadline,
                asgmntName,
                className,
            ]
        );

        return new Result(rowCount === 1);
    } catch (err) {
        logger.error(err);
        return new Result(false);
    }
}


// Delete
// --------------------------------------------
export async function del(asgmntName: string, className: string): Promise<Result> {
    try {
        const { rowCount } = await pool.query(
            `DELETE FROM assignment WHERE short_name = $1 AND
            classID = (SELECT classID FROM class c WHERE short_name = $2)`,
            [asgmntName, className]
        );

        return new Result(rowCount === 1);
    } catch (err) {
        logger.error(err);
        return new Result(false);
    }
}
