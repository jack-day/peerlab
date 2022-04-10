/**
 * Result Class that indicates success and if successful, returns a value
 * @typeparam T Type of value to be returned
 */
export default class Result<T = ''> {
    /** Task Success */
    ok: boolean;
    /** Value to be returned on success */
    value?: T;

    constructor(success: boolean);
    constructor(success: true, value?: T);
    constructor(success: boolean, value?: T) {
        this.ok = success;
        this.value = value;
    }
}
