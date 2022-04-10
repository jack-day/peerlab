// API Types 
// --------------------------------------------
/** User API type */
export interface User {
    uuid: string;
    firstName: string;
    lastName: string;
    avatarUrl: string;
}

/** Me API type */
export interface Me extends User {
    assignmentsCompleted: number;
    assignmentCount: number;
    averageFeedbackRating: number;
    reviewsCompleted: number;
    totalMinReviews: number;
    totalReviewLikes: number;
    totalReviewDislikes: number;
}

/** Class API type */
export interface Class {
    shortName: string;
    ownerUUID: string;
    name: string;
    description?: string;
    avatarUrl: string;
    isOwner: boolean;
    members: number;
    assignments: number;
}

/** Assignment API type */
export interface Assignment {
    shortName: string;
    name: string;
    description?: string;
    anonymous: boolean;
    minReviews: number;
    ratingMax: number;
    deadline?: string;
    reviewsDeadline?: string;
    isClassOwner: boolean;
    workUUID: string;
    totalSubmissions: number;
    peersReviewed: number;
    totalReviewLikes: number;
    totalReviewDislikes: number;
}

/** Work Submission API type */
export interface Work {
    uuid: string;
    userUUID?: string;
    type: 'pdf' | 'url';
    url: string;
    uploadTime: string;
}

/** Review API type */
export interface Review {
    user: User;
    rating: number;
    feedback: string;
    liked?: boolean;
    createTime: string;
}

/** Invite API type */
export interface Invite {
    uuid: string;
    inviteUrl: string;
    expiryTime: string;
    class: {
        shortName: string;
        name: string;
        avatarUrl: string;
        members: number;
        assignments: number;
        isMember: boolean;
    };
}
