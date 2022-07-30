/**
 * @module 
 * @description Generates default avatars for mock users and classes as they
 * would've been directly inserted into the database, preventing the web app
 * from generating them a default avatar.
 */
import { QueryResult } from 'pg';
import pool from 'src/db';
import { addDefault as addDefaultUserAvatar } from 'src/users/avatars';
import { addDefault as addDefaultClassAvatar } from 'src/classes/avatars';

async function addMockUserAvatars() {
    const { rows }: QueryResult<{ uuid: string }> = await pool.query(
        'SELECT uuid FROM usr WHERE userID != 1'
    );

    for (const row of rows) {
        const success = await addDefaultUserAvatar(row.uuid);

        if (!success) {
            console.log(`DEFAULT USER AVATAR FAIL ${row.uuid}`);
        }
    }
}

async function addMockClassAvatars() {
    const { rows }: QueryResult<{ shortName: string }> = await pool.query(
        'SELECT short_name as "shortName" FROM class'
    );

    for (const row of rows) {
        const success = await addDefaultClassAvatar(row.shortName);

        if (!success) {
            console.log(`DEFAULT CLASS AVATAR FAIL ${row.shortName}`);
        }
    }
}

export async function addMockAvatars(): Promise<void> {
    await addMockUserAvatars();
    await addMockClassAvatars();
}
