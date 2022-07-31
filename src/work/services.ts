import path from 'path';
import { promises as fs } from 'fs';
import logger from 'src/logger';
import Result from 'src/common/result';
import { mkdirIfNotExists } from 'src/common/files';
import { Work } from 'src/api/types';
import * as db from './db';

// Helpers
// --------------------------------------------
/**
 * Get the path for a pdf file
 * @param uuid Work submission UUID
 * @param filename Work pdf filename, including file extension
 * @param staticPath True if the path should start from the static directory
 * @returns Pdf directory if no filename give and pdf file path otherwise
 */
export function getPdfPath(uuid: string, filename?: string, staticPath = false): string {
    if (staticPath) {
        const dir = `/user-content/work/${uuid}`;
        return filename ? `${dir}/${filename}` : dir;
    } else {
        const dir = path.join('public', 'user-content', 'work', uuid);
        return filename ? path.join(dir, filename) : dir;
    }
}

/**
 * Remove all work pdf files
 * @param uuid UUID of work to remove PDFs from
 */
async function rmPdfs(uuid: string): Promise<boolean> {
    const files = await fs.readdir(getPdfPath(uuid));

    for (const file of files) {
        try {
            await fs.unlink(getPdfPath(uuid, file));
        } catch (e) {
            logger.error(e);
            return false;
        }
    }
    return true;
}

/**
 * Remove the user-content directory for a work submission
 * @param uuid UUID of work to remove directory from
 */
export async function rmWorkDir(uuid: string): Promise<boolean> {
    try {
        await fs.rmdir(getPdfPath(uuid), { recursive: true });
        return true;
    } catch (e) {
        logger.error(e);
        return false;
    }
}


// Create
// --------------------------------------------
/** Create a new work submission */
export async function create(work: db.InsertWork): Promise<Result<string>> {
    return await db.insert(work);
}

// Read
// --------------------------------------------
export async function get(uuid: string): Promise<Result<Work>> {
    const result = await db.get(uuid);

    if (result.ok && result.value && result.value.type === 'pdf') {
        result.value.url = getPdfPath(uuid, `${result.value.url}.pdf`, true);
    }

    return result;
}


// Update
// --------------------------------------------
export async function update(uuid: string, work: db.UpdateWork): Promise<Result> {
    return await db.update(uuid, work);
}

export async function updatePdf(filePath: string, uuid: string): Promise<Result> {
    const dir = getPdfPath(uuid);
    const dirExists = await mkdirIfNotExists(dir);
    if (!dirExists) return new Result(false);

    const filename = await db.value(uuid);

    if (filename.ok && filename.value) {
        try {
            await rmPdfs(uuid);
            await fs.copyFile(filePath, getPdfPath(uuid, `${filename.value}.pdf`));
            await fs.unlink(filePath);
            return new Result(true);
        } catch (e) {
            logger.error(e);

            try { await fs.unlink(filePath); }
            catch (e) { logger.error(e); }
        }
    }
    return new Result(false);
}
