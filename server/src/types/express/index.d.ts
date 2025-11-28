import { IUser } from '../../models/User';

declare global {
    namespace Express {
        interface Request {
            user?: any; // Using any for now to match existing usage, ideally should be IUser document type
        }
    }
}
