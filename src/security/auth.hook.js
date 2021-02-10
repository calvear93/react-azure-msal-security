import { useEffect, useState } from 'react';
import { types } from './config';
import { cacheAsyncCallback } from './cache.util';
import { AuthenticationService, GraphService } from './services';

/**
 * Returns session state.
 *
 * @export
 *
 * @returns {object} session state
 *  (authenticated, authenticating and error).
 */
export function useAuthenticationState()
{
    const [ state, setState ] = useState(AuthenticationService.state);

    useEffect(() =>
    {
        const id = AuthenticationService.observer.subscribe((newState) => setState(newState));

        return () => AuthenticationService.observer.unsubscribe(id);
    }, [ ]);

    return state;
}

/**
 * Returns login function and
 * current authentication state.
 *
 * @export
 *
 * @param {string} [loginType] login type (redirect or popup).
 *  Avoid using POPUP type on programatic/automatic login, should be used
 *  on user interaction (i.e. button push, page navigation triggered by user, etc.)
 *
 * @returns {Array<any>} login function and auth state
 *  (authenticated, authenticating and error).
 */
export function useLogin(loginType = types.LOGIN_TYPE.REDIRECT)
{
    return () => AuthenticationService.login({ type: loginType });
}

/**
 * Returns logout function and
 * current authentication state.
 *
 * @export
 *
 * @returns {Array<any>} logout function and auth state
 *  (only authenticated).
 */
export function useLogout()
{
    return () =>
    {
        if (AuthenticationService.isAuthenticated())
        {
            AuthenticationService.clearCache();
            AuthenticationService.logout();
        }
    };
}

/**
 * Executes Active Directory
 * automatic account validation.
 *
 * @export
 *
 * @param {boolean} [options] whether authentication is disabled.
 * @param {string} [options.loginType] login type (redirect or popup).
 *  Avoid using POPUP type on programatic/automatic login, should be used
 *  on user interaction (i.e. button push, page navigation triggered by user, etc.)
 *
 * @returns {object} authenticating (bool),
 *  authenticated (bool) and error (Error) data.
 */
export function useAuthentication({ loginType = types.LOGIN_TYPE.REDIRECT } = {})
{
    const { authenticating, authenticated, error } = useAuthenticationState();

    useEffect(() =>
    {
        if (!authenticated && !error)
            AuthenticationService.login({ type: loginType });
    }, [ authenticated ]);

    return { authenticating, authenticated, error };
}

/**
 * Exposes acquireToken function
 * from AuthenticationService
 * for acquires a access token.
 *
 * @export
 *
 * @param {boolean} [forceTokenRefresh] forces to renew token from active directory.
 *
 * @returns {Function} acquireToken.
 */
export function useAcquireToken(forceTokenRefresh = false)
{
    return () => AuthenticationService.acquireToken({ forceTokenRefresh });
}

/**
 * Retrieves Active Directory
 * account info from Graph Service.
 *
 * @export
 *
 * @returns {object} loading, error and info properties.
 */
export function useAccountInfo()
{
    const { authenticated } = useAuthenticationState();
    const canExec = !AuthenticationService.isDisabled() && authenticated;

    const [ info, setInfo ] = useState();
    const [ error, setError ] = useState();
    const [ loading, setLoading ] = useState(canExec);

    useEffect(() =>
    {
        if (canExec)
        {
            const { cacheLocation, infoCacheDurationInDays } = AuthenticationService.baseConfig.cache;

            cacheAsyncCallback(
                `msal.${AuthenticationService.getId()}.info`,
                GraphService.me(),
                {
                    expirationInDays: infoCacheDurationInDays,
                    storageType: cacheLocation
                }
            )
                .then((user) => setInfo(user))
                .catch((error) => setError(error))
                .finally(() => setLoading(false));
        }
    }, [ authenticated ]);

    return { loading, info, error };
}

/**
 * Retrieves Active Directory
 * user photograph from Graph Service.
 *
 * @export
 *
 * @param {string} [size] photo size.

 * @returns {object} loading, error and photo (base64) properties.
 */
export function useAccountAvatar(size = '648x648')
{
    const { authenticated } = useAuthenticationState();
    const canExec = !AuthenticationService.isDisabled() && authenticated;

    const [ avatar, setAvatar ] = useState();
    const [ error, setError ] = useState();
    const [ loading, setLoading ] = useState(canExec);

    useEffect(() =>
    {
        if (canExec)
        {
            const { cacheLocation, photoCacheDurationInDays } = AuthenticationService.baseConfig.cache;

            cacheAsyncCallback(
                `msal.${AuthenticationService.getId()}.avatar${size}`,
                GraphService.photoWithSize(size),
                {
                    expirationInDays: photoCacheDurationInDays,
                    storageType: cacheLocation
                }
            )
                .then((photo) => setAvatar(photo))
                .catch((error) => setError(error))
                .finally(() => setLoading(false));
        }
    }, [ authenticated ]);

    return { loading, avatar, error };
}
