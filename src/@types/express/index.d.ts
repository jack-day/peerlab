/* eslint-disable */
import { ParsedQs } from 'qs';
import * as core from 'express-serve-static-core';

declare module 'express-serve-static-core' {
    // Create an AuthenticatedRequest interface
    interface AuthenticatedRequest<P, ResBody, ReqBody, ReqQuery, Locals> extends Request<P, ResBody, ReqBody, ReqQuery, Locals> {
        user: Express.User;
    }

    // New overload to add AuthenticatedRequest as a request type to router request handler functions
    interface IRouterMatcher<
        T,
        Method extends 'all' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head' = any
    > {
        <
            P = ParamsDictionary,
            ResBody = any,
            ReqBody = any,
            ReqQuery = ParsedQs,
            Locals extends Record<string, any> = Record<string, any>
        >(
            path: PathParams,
            ...handlers: Array<(
                req: AuthenticatedRequest<P, ResBody, ReqBody, ReqQuery, Locals>,
                res: Response<ResBody, Locals>,
                next: NextFunction,
            ) => void>
        ): T;
    }
}

// Export AuthenticatedRequest under express
declare module 'express' {
    export interface AuthenticatedRequest<
        P = core.ParamsDictionary,
        ResBody = any,
        ReqBody = any,
        ReqQuery = core.Query,
        Locals extends Record<string, any> = Record<string, any>
    > extends core.AuthenticatedRequest<P, ResBody, ReqBody, ReqQuery, Locals> {}
}
