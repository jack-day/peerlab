import { QueryResult } from 'pg';
import pool from 'src/db';
import logger from 'src/logger';
import Result from 'src/common/result';
import { Work } from 'src/api/types';

// Types
// --------------------------------------------
interface WorkBase {
    className: string;
    asgmntName: string;
    email: string;
    type: 'pdf' | 'url';
}

interface WorkPdf extends WorkBase {
    type: 'pdf';
    filename: string;
}

interface WorkURL extends WorkBase {
    type: 'url';
    url: string;
}

export type InsertWork = WorkPdf | WorkURL;

interface UpdateWorkPdf {
    type: 'pdf';
    filename: string;
}

interface UpdateWorkURL {
    type: 'url';
    url: string;
}

export type UpdateWork = UpdateWorkPdf | UpdateWorkURL;


// Validation
// --------------------------------------------
/** Check a work submission exists */
export async function exists(assignmentShortName: string, classShortName: string, email: string): Promise<Result<boolean>>{
    try {
        const { rows } = await pool.query(
            `SELECT workID FROM work w
            INNER JOIN usr u ON u.userID=w.userID
            INNER JOIN assignment a ON a.assignmentID=w.assignmentID
            INNER JOIN class c ON c.classID=a.classID
            WHERE a.short_name = $1 AND c.short_name = $2 AND u.email = $3`,
            [assignmentShortName, classShortName, email]
        );

        return new Result(true, rows.length === 1);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}

/** Check a user is the owner of a given work submission */
export async function userIsOwner(uuid: string, email: string): Promise<Result<boolean>> {
    try {
        const { rows } = await pool.query(
            `SELECT workID FROM work w
            INNER JOIN usr u ON u.userID=w.userID
            WHERE w.uuid = $1 AND u.email = $2`,
            [uuid, email]
        );

        return new Result(true, rows.length === 1);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}

/** Check a work submission is from one of the user's classes */
export async function workFromClass(uuid: string, email: string): Promise<Result<boolean>> {
    try {
        const { rows } = await pool.query(
            `SELECT workID FROM work w
            INNER JOIN assignment a ON a.assignmentID=w.assignmentID
            INNER JOIN class c ON c.classID=a.classID
            INNER JOIN class_usr cu ON cu.classID=c.classID
            INNER JOIN usr u ON u.userID=cu.userID
            WHERE w.uuid = $1 AND u.email = $2`,
            [uuid, email]
        );

        return new Result(true, rows.length === 1);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}

/**
 * Check if assignment deadline of work submission has passed
 * @returns True if a deadline is set and it has passed
 */
export async function passedDeadline(uuid: string): Promise<Result<boolean>> {
    try {
        const { rows }: QueryResult<{ passed: boolean }> = await pool.query(
            `SELECT deadline < CURRENT_TIMESTAMP AND deadline IS NOT NULL as passed
            FROM work w
            INNER JOIN assignment a ON a.assignmentID=w.assignmentID
            WHERE uuid = $1`,
            [uuid]
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
export async function futureDeadline(uuid: string): Promise<Result<boolean>> {
    try {
        const { rows }: QueryResult<{ future: boolean }> = await pool.query(
            `SELECT (
                deadline IS NOT NULL AND deadline >= CURRENT_TIMESTAMP
            ) as future
            FROM work w
            INNER JOIN assignment a ON a.assignmentID=w.assignmentID
            WHERE uuid = $1`,
            [uuid]
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
export async function passedReviewsDeadline(uuid: string): Promise<Result<boolean>> {
    try {
        const { rows }: QueryResult<{ passed: boolean }> = await pool.query(
            `SELECT (
                reviews_deadline < CURRENT_TIMESTAMP AND
                reviews_deadline IS NOT NULL
            ) as passed
            FROM work w
            INNER JOIN assignment a ON a.assignmentID=w.assignmentID
            WHERE uuid = $1`,
            [uuid]
        );

        return new Result(true, rows[0].passed);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}


// Create
// --------------------------------------------
export async function insert(work: InsertWork): Promise<Result<string>> {
    try {
        const value: string = work.type === 'pdf' ? work.filename : work.url;
        
        const { rows }: QueryResult<{ uuid: string }> = await pool.query(
            `INSERT INTO work (userID, assignmentID, value, type)
            VALUES (
                ( SELECT userID FROM usr WHERE email = $1 ),
                (
                    SELECT assignmentID FROM assignment a
                    INNER JOIN class c ON c.classID=a.classID
                    WHERE c.short_name = $2 AND a.short_name = $3 
                ),
                $4,
                $5
            ) RETURNING uuid`,
            [work.email, work.className, work.asgmntName, value, work.type]
        );

        return new Result(true, rows[0].uuid);
    } catch (err) {
        logger.error(err);
        return new Result(false);
    }
}


// Read
// --------------------------------------------
export async function get(uuid: string): Promise<Result<Work>> {
    try {
        const { rows }: QueryResult<Work> = await pool.query(
            `SELECT
                w.uuid,
                u.uuid as "userUUID",
                w.type,
                w.value as "url",
                w.upload_time as "uploadTime"
            FROM work w
            INNER JOIN usr u ON u.userID=w.userID
            WHERE w.uuid = $1`,
            [uuid]
        );

        return new Result(true, rows[0]);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}

export async function type(uuid: string): Promise<Result<string>> {
    try {
        const { rows }: QueryResult<{ type: string }> = await pool.query(
            `SELECT type FROM work WHERE uuid = $1`,
            [uuid]
        );

        return new Result(true, rows[0].type);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}

export async function value(uuid: string): Promise<Result<string>> {
    try {
        const { rows }: QueryResult<{ value: string }> = await pool.query(
            `SELECT value FROM work WHERE uuid = $1`,
            [uuid]
        );

        return new Result(true, rows[0].value);
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}

/** Get rating maximum of work assignment */
export async function ratingMax(uuid: string): Promise<Result<number>> {
    try {
        const { rows }: QueryResult<{ ratingMax: string }> = await pool.query(
            `SELECT a.rating_max as "ratingMax" FROM work w
            INNER JOIN assignment a ON a.assignmentID=w.assignmentID
            WHERE w.uuid = $1`,
            [uuid]
        );

        return new Result(true, parseInt(rows[0].ratingMax));
    } catch (e) {
        logger.error(e);
        return new Result(false);
    }
}


// Update
// --------------------------------------------
export async function update(uuid: string, work: UpdateWork): Promise<Result> {
    try {
        const value: string = work.type === 'pdf' ? work.filename : work.url;
        await pool.query(
            `UPDATE work SET type = $1, value = $2, upload_time = CURRENT_TIMESTAMP WHERE uuid = $3`,
            [work.type, value, uuid]
        );

        return new Result(true);
    } catch (err) {
        logger.error(err);
        return new Result(false);
    }
}
