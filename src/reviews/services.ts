import Result from 'src/common/result';
import { Review } from 'src/api/types';
import { convertDBToAPI as convertUserDBToAPI } from 'src/users/services';
import * as db from './db';

// Create
// --------------------------------------------
/** Create a new review */
export async function create(uuid: string, review: db.InsertReview, email: string): Promise<Result> {
    return await db.insert(uuid, review, email);
}

/** Add a like to a review */
export async function like(workUUID: string, reviewerUUID: string, email: string): Promise<Result> {
    return await db.like({
        workUUID,
        reviewerUUID,
        userEmail: email,
        isLike: true,
    });
}

/** Add a dislike to a review */
export async function dislike(workUUID: string, reviewerUUID: string, email: string): Promise<Result> {
    return await db.like({
        workUUID,
        reviewerUUID,
        userEmail: email,
        isLike: false,
    });
}


// Read
// --------------------------------------------
/** Convert review object from database for use in API */
function convertDBToAPI(review: db.Review): Review {
    return {
        user: convertUserDBToAPI({
            uuid: review.userUUID,
            firstName: review.firstName,
            lastName: review.lastName,
            avatarMimetype: review.avatarMimetype,
        }),
        rating: review.rating,
        feedback: review.feedback,
        ...(review.liked !== null ? { liked: review.liked } : {}),
        createTime: review.createTime,
    };
}

export async function getAll(uuid: string, email: string): Promise<Result<Review[]>> {
    const dbReviews = await db.getAll(uuid, email);

    if (dbReviews.ok && dbReviews.value) {
        return new Result(true, dbReviews.value.map(convertDBToAPI));
    }
    return new Result(false);
}


// Delete
// --------------------------------------------
/** Delete a like or dislike from a review */
export async function deleteLike(workUUID: string, reviewerUUID: string, email: string): Promise<Result> {
    return await db.deleteLike(workUUID, reviewerUUID, email);
}
