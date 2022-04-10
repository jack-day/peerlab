import path from 'path';
import { promises as fs } from 'fs';
import logger from 'src/logger';

/** Default avatar file */
export const defaultFile: { path: string; mimetype: 'image/png'; } = {
    path: path.join('public', 'assets', 'img', 'avatar-default.png'),
    mimetype: 'image/png',
};

/**
 * Get the path for a user's avatar
 * @param uuid User's UUID
 * @param mimetype Avatar file mimetype
 * @param staticPath True if the path should start from the static directory
 */
export function getPath(uuid: string, mimetype: string, staticPath = false): string {
    const filename = mimetype === 'image/png' ? `${uuid}.png`: `${uuid}.jpg`;

    if (staticPath) {
        return `/user-content/users/avatars/${filename}`;
    } else {
        return path.join('public', 'user-content', 'users', 'avatars', filename);
    }
}

/** Remove avatar */
export async function remove(uuid: string, mimetype: string): Promise<boolean> {
    try {
        await fs.unlink(getPath(uuid, mimetype));
        return true;
    } catch (e) {
        logger.warn(e);
        return false;
    }
}

/** Add the default avatar to a user */
export async function addDefault(uuid: string): Promise<boolean> {
    try {
        await fs.copyFile(
            defaultFile.path,
            getPath(uuid, defaultFile.mimetype)
        );
        return true;
    } catch (e) {
        logger.error(e);
        return false;
    }
}
