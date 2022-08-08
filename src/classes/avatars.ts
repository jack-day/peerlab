import path from 'path';
import { promises as fs } from 'fs';
import logger from 'src/logger';

/** Default avatar file */
export const defaultFile: { path: string; mimetype: 'image/png'; } = {
    path: path.join('public', 'assets', 'img', 'class-avatar-default.png'),
    mimetype: 'image/png',
};

/**
 * Get the path for a class's avatar
 * @param shortName Class short name
 * @param mimetype Avatar file mimetype
 * @param staticPath True if the path should start from the static directory
 */
export function getPath(shortName: string, mimetype: string, staticPath = false): string {
    const filename = mimetype === 'image/png'
        ? `${shortName}.png`
        : `${shortName}.jpg`;

    if (staticPath) {
        return `/user-content/classes/avatars/${filename}`;
    } else {
        return path.join('public', 'user-content', 'classes', 'avatars', filename);
    }
}

/** Remove avatar */
export async function remove(shortName: string, mimetype: string): Promise<boolean> {
    try {
        await fs.unlink(getPath(shortName, mimetype));
        return true;
    } catch (e) {
        logger.warn(e);
        return false;
    }
}

/** Add the default avatar to a class */
export async function addDefault(shortName: string): Promise<boolean> {
    try {
        await fs.copyFile(
            defaultFile.path,
            getPath(shortName, defaultFile.mimetype)
        );
        return true;
    } catch (e) {
        logger.error(e);
        return false;
    }
}

/** Update avatar file with a class's new short name */
export async function updateShortName(oldName: string, newName: string, mimetype: string): Promise<boolean> {
    try {
        const oldPath = getPath(oldName, mimetype);
        await fs.copyFile(oldPath, getPath(newName, mimetype));
        await fs.unlink(oldPath);
        return true;
    } catch (e) {
        logger.error(e);
        return false;
    }
}
