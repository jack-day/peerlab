import express from 'express';
import { unlinkSync } from 'fs';
import { GoogleProfile } from 'simple-google-openid';
import Result from 'src/common/result';
import ResponseErrors, { ResponseError } from 'src/common/response-errors';
import * as core from './core'; export { core };
import { exists as userExists } from 'src/users/db';

// Types
// --------------------------------------------
type Check = (value: unknown) => string;

interface Options {
    type: string;
    enum?: unknown[];
    checks?: Check[];
}

// ---- Request Params Schema ----
export interface ParamsSchema {
    [name: string]: Check[];
}

// ---- Request Body Schema ----
interface ConditionalRequired {
    field: string;
    value: string;
}

interface BodyOptions extends Options {
    required: boolean | ConditionalRequired;
}

export interface BodySchema {
    [name: string]: BodyOptions;
}

// ---- Multer File Upload Schema ----
interface FileSchema {
    mimetype: string | string[]
    optional?: true;
}

// ---- System Constraint Checks ----
export interface RequestCheckError {
    code?: number;
    field?: string;
    msg: string;
}

type RequestCheck = (req: express.AuthenticatedRequest) =>
    Promise<Result<RequestCheckError>> |Result<RequestCheckError>;

// ---- Validation Schema ----
export interface Schema {
    /** Can be set to true if the route does not require
     * the authenticated user to have an account */
    accountOptional?: true;
    /** Schema to validate req params */
    params?: ParamsSchema;
    /** Schema to validate req body */
    body?: BodySchema;
    /** Functional checks to be run on the request */
    checks?: RequestCheck[];
    /** Schema to validate multer file upload */
    file?: FileSchema;
}


// User Account Validation
// --------------------------------------------
async function validateUserAccount(user: GoogleProfile, res: express.Response): Promise<boolean>  {
    const exists = await userExists(user.emails[0].value);

    if (exists.ok) {
        if (!exists.value) {
            res.sendStatus(401);
            return true;
        }
    } else {
        res.sendStatus(500);
        return true;
    }
    return false;
}


// Type Validation
// --------------------------------------------
const types: Record<string, Check> = {
    text: (txt) => {
        if (typeof txt !== 'string') {
            return 'Not text';
        }
        return '';
    },
    number: (num) => {
        if (typeof num !== 'number') {
            return 'Not an number';
        }
        return '';
    },
    integer: (int) => {
        if (typeof int !== 'number' || (typeof int === 'number' && !Number.isInteger(int))) {
            return 'Not an integer';
        }
        return '';
    },
    boolean: (bool) => {
        if (typeof bool !== 'boolean') {
            return 'Not an boolean';
        }
        return '';
    },
    timestamp: (time: any) => {
        if (isNaN(Date.parse(time))) {
            return 'Not a valid timestamp';  
        } else if (new Date(time).toISOString() !== time) {
            return 'Timestamp must be in ISO 8601 format';
        }
        return '';
    },
};

const converters: Record<string, (value: any) => unknown> = {
    timestamp: (time: string) => {
        return new Date(time);
    },
};


// Get Checks from Schema Options
// --------------------------------------------
/**
 * Get an enum check function that checks a value is in a given enum
 * @param enumArr Enum values as array
 * @returns Enum check function 
 */
function enumCheck(enumArr: unknown[]): (value: unknown) => string {
    return (val) => {
        if (!enumArr.includes(val)) {
            return 'Must be one from: ' + enumArr;
        }
        return '';
    };
}

/**
 * Get all checks from validation options, in the non-breaking order:
 * - Type Check
 * - Enum Check, if needed
 * - All other checks given
 * @returns All check functions to be run
 */
function getAllChecks(opts: Options): Check[] {
    const checks = [types[opts.type]]; 

    if (opts.enum) checks.push(enumCheck(opts.enum));
    if (opts.checks) checks.push(...opts.checks);

    return checks;
}


// Request Params Validation
// --------------------------------------------
/** Validation for request parameters */
function validateParams(req: express.Request, res: express.Response, schema: ParamsSchema): boolean {
    const errors: ResponseError[] = [];

    for (const [name, checks] of Object.entries(schema)) {
        for (const check of checks) {
            const error = check(req.params[name]);
            if (error) {
                errors.push({
                    param: name,
                    message: error,
                });
                break;
            }
        }
    }

    if (errors.length > 0) {
        res.status(400).json(new ResponseErrors(errors));
        return true;
    }
    return false;
}


// Request Body Validation
// --------------------------------------------
/**
 * Run validation check for empty value
 * @returns Error message if error found,
 * empty string if validation should be skipped and otherwise void
 */
function checkEmpty(body: Record<string, unknown>, name: string, required: boolean | ConditionalRequired): string | void {
    const value = body[name];
    const error = core.required(value);

    if (error) {
        if (required === true || (typeof required === 'object' && body[required.field] === required.value)) {   
            return error;
        } else {
            delete body[name]; // Delete field to stop empty values being processed
            return ''; // Skip validation if optional property is not given
        }
    } else if (typeof required === 'object' &&  body[required.field] !== required.value) {
        // Skip validation on conditionally required properties
        // where the dependent field does not match the needed value
        delete body[name];
        return ''; 
    }
}

/**
 * Run validation on a value from request body
 * @returns Error message if error found, otherwise void
 */
function check(body: Record<string, unknown>, name: string, opts: BodyOptions): string | void {
    const emptyErr = checkEmpty(body, name, opts.required);
    if (emptyErr || emptyErr === '') return emptyErr;

    for (const check of getAllChecks(opts)) {
        const error = check(body[name]);
        if (error) return error;
    }

    if (converters[opts.type]) {
        body[name] = converters[opts.type](body[name]);
    }
}

/** Validation for request body */
function validateBody(body: Record<string, unknown>, res: express.Response, schema: BodySchema): boolean {
    const errors: ResponseError[] = [];

    for (const [name, opts] of Object.entries(schema)) {
        const error = check(body, name, opts);
        if (error) errors.push({
            field: name,
            message: error,
        });
    }

    if (errors.length > 0) {
        res.status(400).json(new ResponseErrors(errors));
        return true;
    }
    return false;
}


// System Constraint Validation
// --------------------------------------------
/**
 * Run functional request checks to ensure the incoming data conforms to system contraints.
 * @param checks Request validation checks
 * @returns Result containing an RequestCheckError or empty if validation passes
 */
async function runRequestChecks(req: express.AuthenticatedRequest, checks: RequestCheck[]): Promise<Result<RequestCheckError>> {
    for (const check of checks) {
        const result = await check(req);
        if ((result.ok && result.value) || !result.ok) return result;
    }
    return new Result(true);
}

/** Validation for system constraint request checks */
async function validateRequest(req: express.AuthenticatedRequest, res: express.Response, checks: RequestCheck[]): Promise<boolean> {
    const error = await runRequestChecks(req, checks);
    
    if (error.ok) {
        if (error.value) {
            const err = new ResponseErrors({
                ...(error.value.field ? { field: error.value.field } : {}),
                message: error.value.msg,
            });
            res.status(error.value.code ?? 400).json(err);
            return true;
        }
    } else {
        res.sendStatus(500);
        return true;
    }
    return false;
}


// Multer File Upload Validation
// --------------------------------------------
/**
 * Validate multer upload MIME type
 * @param mimetypes MIME types to be accepted
 * @returns True if all files have an accepted type, false otherwise
 */
function checkMimetype(req: express.Request, mimetypes: string[]): string {
    if (req.files) {
        // Multiple files as array
        if (Array.isArray(req.files)) {
            for (const file of req.files) {
                if (!mimetypes.includes(file.mimetype)) {
                    return file.mimetype;
                }
            }
        // Multiple files as object
        } else {
            for (const files of Object.values(req.files)) {
                for (const file of files) {
                    if (!mimetypes.includes(file.mimetype)) {
                        return file.mimetype;
                    }
                }
            }
        }
    // Single File
    } else if (req.file) {
        if (!mimetypes.includes(req.file.mimetype)) {
            return req.file.mimetype;
        }
    }
    return '';
}

/**
 * Validate multer upload file
 * @param mimetypes MIME types to be accepted
 * @param optional If file is optional
 * @returns  Error message if error found, otherwise empty string
 */
function checkFile(req: express.Request, mimetypes: string[], optional?: true): string {
    if (!req.file && !req.files) {
        return !optional ? 'file upload is required' : '';
    } else {
        const mimetypeError = checkMimetype(req, mimetypes);
        if (mimetypeError) {
            return `invalid file type ${mimetypeError}, must be of type: ${mimetypes}`;
        }
    }
    return '';
}

/** Remove file uploaded through multer */
function removeFileUpload(req: express.Request): void {
    if (req.files) {
        // Multiple files as array
        if (Array.isArray(req.files)) {
            for (const file of req.files) {
                unlinkSync(file.path);
            }
        // Multiple files as object
        } else {
            for (const files of Object.values(req.files)) {
                for (const file of files) {
                    unlinkSync(file.path);
                }
            }
        }
    // Single File
    } else if (req.file) {
        unlinkSync(req.file.path);
    }
}

/** Validation for multer file upload */
function validateFile(req: express.Request, res: express.Response, schema: FileSchema): boolean {
    if (typeof schema.mimetype === 'string') schema.mimetype = [schema.mimetype];
    const error = checkFile(req, schema.mimetype , schema.optional);
    
    if (error) {
        res.status(400).json(new ResponseErrors({ message: error }));
        removeFileUpload(req);
        return true;
    }
    return false;
}


// Middleware
// --------------------------------------------
export async function requireAccount(
    req: express.AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
): Promise<void> {
    const err = await validateUserAccount(req.user, res);
    if (!err) next();
}

export default function validate(schema: Schema = {}): (
    req: express.AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction
) => Promise<void> {
    /* eslint-disable-next-line */
    return async (req, res, next) => {
        if (!schema.accountOptional) {
            const err = await validateUserAccount(req.user, res);
            if (err) return;
        }

        if (schema.params) {
            const err = validateParams(req, res, schema.params);
            if (err) return;
        }

        if (schema.body) {
            const err = validateBody(req.body, res, schema.body);
            if (err) return;
        }

        if (schema.checks) {
            const err = await validateRequest(req, res, schema.checks);
            if (err) return;
        }

        if (schema.file) {
            const err = validateFile(req, res, schema.file);
            if (err) return;
        }

        next();
    };
}
