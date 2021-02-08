import { types } from './config';

/**
 * Writes a value to storage.
 *
 * @param {string} key item key.
 * @param {any} value value for store.
 * @param {string} [storageType] storage type. Default is localStorage.
 */
export function write(key, value, storageType = types.CACHE.LOCAL_STORAGE)
{
    try
    {
        if (!value)
            window[storageType].setItem(key, value);
        else
            window[storageType].setItem(key, JSON.stringify(value));
    }
    catch
    {
        window[storageType].clear();
    }
}

/**
 * Reads a value from storage.
 *
 * @param {string} key item key.
 * @param {string} [storageType] storage type. Default is localStorage.
 *
 * @returns {any} stored value.
 */
export function read(key, storageType = types.CACHE.LOCAL_STORAGE)
{
    const data = window[storageType].getItem(key);

    if (!data || data === 'null' || data === 'undefined' || data === '{}' || data === '[]')
        return null;

    return JSON.parse(data);
}

/**
 * Calculates the date in
 * next days.
 *
 * @param {number} days next days.
 *
 * @returns {Date} date in next days from now.
 */
function dateNextDays(days)
{
    const date = new Date();

    if (!days)
        return null;

    date.setDate(date.getDate() + days);

    return date;
}

/**
 * Persists the result from an asynchronous
 * callback, storing it in browser storage.
 *
 * @param {string} key persisted value accessor.
 * @param {Promise<any>} promise async callback.
 * @param {object} [options] options.
 * @param {number} [options.expirationInDays] expiration in days.
 * @param {string} [options.storageType] storage type.
 *
 * @throws {Error} on non valid key.
 *
 * @returns {Promise<any>} cached/persisted value or promise result.
 */
export async function cacheAsyncCallback(key, promise, { expirationInDays, storageType = types.CACHE.LOCAL_STORAGE } = {})
{
    if (!key)
        throw new Error('[key] is required.');

    const cache = read(key, storageType);

    // optimistic data refresh.
    if (cache?.expiration && new Date().getTime() > new Date(cache.expiration).getTime())
    {
        // delayed data refresh from source.
        (async () =>
        {
            const data = await promise;
            write(key, { expiration: dateNextDays(expirationInDays), data }, storageType);
        })();
    }

    if (cache)
        return Promise.resolve(cache.data);

    const data = await promise;
    write(key, { expiration: dateNextDays(expirationInDays), data }, storageType);

    return data;
}
