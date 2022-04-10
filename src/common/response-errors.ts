export interface ResponseError {
    message: string;
    field?: string;
    param?: string;
}

/** Express Error Response */
export default class ResponseErrors {
    errors: ResponseError[];

    constructor(errors: ResponseError | ResponseError[]) {
        if (!Array.isArray(errors)) errors = [errors];

        this.errors = [];
        for (const error of errors) {
            this.errors.push(error);
        }
    }
}
