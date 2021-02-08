import { useEffect, useState } from 'react';
import { types } from './config';
import { cacheAsyncCallback } from './cache.util';
import { AuthenticationService, GraphService } from './services';

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
    const [ disabled, setDisabled ] = useState(!AuthenticationService.isAuthenticated());
    const state = useAuthentication({ disabled, loginType });

    function login()
    {
        setDisabled(false);
    }

    return [ login, state ];
}

/**
 * Returns login function and
 * current authentication state
 * using an async callback for
 * post AD auth validation.
 *
 * @export
 *
 * @param {Promise<boolean>} asyncCallback a promise callback.
 * @param {string} [loginType] login type (redirect or popup).
 *  Avoid using POPUP type on programatic/automatic login, should be used
 *  on user interaction (i.e. button push, page navigation triggered by user, etc.)
 *
 * @returns {Array<any>} login function and auth state
 *  (authenticated, authenticating and error).
 */
export function useConditionalLogin(asyncCallback, loginType = types.LOGIN_TYPE.REDIRECT)
{
    const [ disabled, setDisabled ] = useState(!AuthenticationService.isAuthenticated());
    const state = useConditionalAuthentication(asyncCallback, { disabled, loginType });

    function login()
    {
        setDisabled(false);
    }

    return [ login, state ];
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
 * @param {boolean} [options.disabled] whether authentication is disabled.
 * @param {string} [options.loginType] login type (redirect or popup).
 *  Avoid using POPUP type on programatic/automatic login, should be used
 *  on user interaction (i.e. button push, page navigation triggered by user, etc.)
 *
 * @returns {object} authenticating (bool),
 *  authenticated (bool) and error (Error) data.
 */
export function useAuthentication({ disabled = false, loginType = types.LOGIN_TYPE.REDIRECT } = {})
{
    const [ authenticated, setAuthenticated ] = useState(AuthenticationService.isAuthenticated() || disabled);
    const [ authenticating, setAuthenticating ] = useState(!authenticated);
    const [ error, setError ] = useState();

    useEffect(() =>
    {
        if (!authenticated && !error)
        {
            AuthenticationService.login({ type: loginType })
                .then(() => setAuthenticated(true))
                .catch((error) =>
                {
                    setAuthenticated(false);
                    setError(error);
                })
                .finally(() => setAuthenticating(false));
        }
    }, [ authenticated ]);

    useEffect(() =>
    {
        const isAuthenticated = AuthenticationService.isAuthenticated() || disabled;

        setAuthenticated(isAuthenticated);
        setAuthenticating(!isAuthenticated);
    }, [ disabled ]);

    return { authenticating, authenticated, error };
}

/**
 * Executes Active Directory
 * automatic account validation
 * and a condition post condition.
 *
 * @export
 *
 * @param {Promise<boolean>} asyncCallback a promise callback.
 *  Returns true if authentication is done, false in otherwise.
 * @param {boolean} [options] whether authentication is disabled.
 * @param {boolean} [options.disabled] whether authentication is disabled.
 * @param {string} [options.loginType] login type (redirect or popup).
 * Avoid using POPUP type on programatic/automatic login, should be used
 * on user interaction (i.e. button push, page navigation triggered by user, etc.)
 *
 * @returns {object} authenticating (bool),
 * authenticated (bool) and error (Error) data.
 */
export function useConditionalAuthentication(asyncCallback, options = {})
{
    const { disabled } = options;

    const {
        authenticated: baseAuthenticated,
        authenticating: baseAuthenticating,
        error: baseError
    } = useAuthentication(options);

    const [ authenticated, setAuthenticated ] = useState(!disabled);
    const [ authenticating, setAuthenticating ] = useState(!disabled);
    const [ error, setError ] = useState();

    useEffect(() =>
    {
        if (!disabled && !baseAuthenticating && baseAuthenticated && AuthenticationService.isAuthenticated())
        {
            setAuthenticating(true);

            asyncCallback(AuthenticationService)
                .then((valid) => setAuthenticated(valid))
                .catch((error) =>
                {
                    setAuthenticated(false);
                    setError(error);
                })
                .finally(() => setAuthenticating(false));
        }
    }, [ authenticated, baseAuthenticated, baseAuthenticating, disabled ]);

    return { authenticating: authenticating || baseAuthenticating, authenticated, error: error || baseError };
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
 * @param {boolean} [disabled] whether authentication is disabled.

 * @returns {object} loading, error and info properties.
 */
export function useAccountInfo(disabled = false)
{
    const { authenticated } = useAuthentication();
    const [ info, setInfo ] = useState();
    const [ error, setError ] = useState();
    const [ loading, setLoading ] = useState(!disabled && authenticated);

    useEffect(() =>
    {
        if (!disabled && authenticated)
        {
            const { cacheLocation, infoCacheDurationInDays } = AuthenticationService.BaseConfig.cache;

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
    }, [ authenticated, disabled ]);

    return { loading, info, error };
}

/**
 * Retrieves Active Directory
 * user photograph from Graph Service.
 *
 * @export
 *
 * @param {string} [size] photo size.
 * @param {boolean} [disabled] whether authentication is disabled.

 * @returns {object} loading, error and photo (base64) properties.
 */
export function useAccountAvatar(size = '648x648', disabled = false)
{
    const { authenticated } = useAuthentication();
    const [ avatar, setAvatar ] = useState();
    const [ error, setError ] = useState();
    const [ loading, setLoading ] = useState(!disabled && authenticated);

    useEffect(() =>
    {
        if (!disabled && authenticated)
        {
            const { cacheLocation, photoCacheDurationInDays } = AuthenticationService.BaseConfig.cache;

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
    }, [ authenticated, disabled ]);

    return { loading, avatar, error };
}
