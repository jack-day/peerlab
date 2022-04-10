import { constants as fsConstants, promises as fs } from 'fs';
import logger from 'src/logger';

/**
 * Check if a path exists
 * @param path A path to a file or directory
 * @returns True if the path exists
 */
export async function fsExists(path: string): Promise<boolean> {
    try {
        await fs.access(path, fsConstants.F_OK);
        return true;
    } catch {
        return false;
    }
}

/**
 * Make a given directory if it doesn't already exist
 * @param dir Directory path
 * @returns True if the directory exists or has been created
 */
export async function mkdirIfNotExists(dir: string): Promise<boolean> {
    const exists = await fsExists(dir);

    if (!exists) {
        try {
            await fs.mkdir(dir);
            return true;
        } catch (e) {
            logger.error(e);
            return false;
        }
    }
    return true;
}

