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

        if (success) {
            console.log(`DEFAULT USER AVATAR INSERT ${row.uuid}`);
        } else {
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

        if (success) {
            console.log(`DEFAULT CLASS AVATAR INSERT ${row.shortName}`);
        } else {
            console.log(`DEFAULT CLASS AVATAR FAIL ${row.shortName}`);
        }
    }
}

(async () => {
    await addMockUserAvatars();
    await addMockClassAvatars();
})();
