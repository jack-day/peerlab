/* eslint-disable */
import { GoogleProfile } from 'simple-google-openid';

declare global {
    namespace Express {
        interface User extends GoogleProfile {}
    }
}
