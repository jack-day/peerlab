import Result from 'src/common/result';
import { Assignment, Work } from 'src/api/types';
import { getPdfPath } from 'src/work/services';
import * as db from './db';

// Create
// --------------------------------------------
export async function create(asgmnt: db.InsertAsgmnt, className: string): Promise<Result> {
    return await db.insert(asgmnt, className);
}


// Read
// --------------------------------------------
export async function getAll(className: string, email: string): Promise<Result<Assignment[]>> {
    return await db.getAll(className, email);
}

export async function get(asgmntName: string, className: string, email: string): Promise<Result<Assignment>> {
    return await db.get(asgmntName, className, email);
}

export async function getPeerWork(asgmntName: string, className: string, email: string): Promise<Result<Work>> {
    const work = await db.getPeerWork(asgmntName, className, email);

    if (work.ok && work.value && work.value.type === 'pdf') {
        work.value.url = getPdfPath(
            work.value.uuid,
            `${work.value.url}.pdf`,
            true
        );
    }

    return work;
}


// Update
// --------------------------------------------
export async function update(asgmnt: db.InsertAsgmnt, asgmntName: string, className: string): Promise<Result> {
    return await db.update(asgmnt, asgmntName, className);
}


// Delete
// --------------------------------------------
export async function del(asgmntName: string, className: string): Promise<Result> {
    return await db.del(asgmntName, className);
}
