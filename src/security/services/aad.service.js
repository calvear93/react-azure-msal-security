/**
 * MSAL Microsoft Authentication service.
 *
 * @summary MSAL service wrapper.
 * @author Alvear Candia, Cristopher Alejandro <calvear93@gmail.com>
 *
 * Created at     : 2020-05-23 19:53:33
 * Last modified  : 2021-05-19 17:51:37
 */

import * as Msal from 'msal';
import { createConfig, types } from '../config';
import Observer from '../observer.util';

const AuthenticationService = {

    // MSAL base config
    baseConfig: null,

    // MSAL authentication context
    context: null,

    // handles hook listeners for state changes
    observer: new Observer(),

    // stores session state, authenticated, authenticating and error
    state: {},

    // stores current token acquisition
    // request for singleton behaviour
    acquireTokenPromise: null,

    // stores authentication process
    // request for singleton behaviour
    authenticatingPromise: null,

    /**
     * Initializes MSAL authentication context.
     *
     * All config properties accepts
     * environment variables values.
     *
     * @param {object} config MSAL auth config.
     * @param {string} config.tenantId organization Azure Object Id.
     * @param {string} config.clientId application Azure Object Id.
     * @param {string} config.loginActionRedirect redirect path after login.
     *  If navigateToRequestAfterLogin is false.
     * @param {string} config.logoutActionRedirect redirect path after logout.
     * @param {string} config.tokenRefreshUri path for renew auth token.
     *  Should be a empty page (null React component) and should be added to
     *  authentication routes in Azure App Registration.
     * @param {number} config.tokenRenewalOffset token renewal interval.
     * @param {string} config.navigateToRequestAfterLogin whether app redirects to previous path after login.
     * @param {boolean} [disabled] whether authentication is disabled globally.
     */
    init(config, disabled)
    {
        AuthenticationService.disabled = disabled;

        if (disabled)
        {
            AuthenticationService.context = null;
        }
        else
        {
            AuthenticationService.baseConfig = createConfig(config);
            AuthenticationService.context = new Msal.UserAgentApplication(AuthenticationService.baseConfig);
        }

        // initializes session state
        AuthenticationService.setState({
            authenticated: disabled || !!AuthenticationService.context.getAccount(),
            authenticating: !disabled && AuthenticationService.context.getLoginInProgress()
        });
    },

    /**
     * Performs an state updating,
     * triggering the observer if
     * any change is detected.
     *
     * @param {object} changes partial session state.
     * @param {object} changes.authenticated whether user is authenticated
     * @param {object} changes.authenticating wheter authentication is in process
     * @param {string} changes.error wheter exists any error on authentication
     *
     * @returns {object} session state.
     */
    setState: (changes) =>
    {
        let newState = { ...AuthenticationService.state, ...changes };

        // validates internal changes
        for (let key of Object.keys(newState))
        {
            if (AuthenticationService.state[key] !== newState[key])
            {
                AuthenticationService.state = newState;
                AuthenticationService.observer.trigger(AuthenticationService.state);

                return AuthenticationService.state;
            }
        }

        return AuthenticationService.state;
    },

    /**
     * Retrieves current access token cached.
     *
     * @param {object} [config] options.
     * @param {Array} [config.scopes] array of scopes allowed.
     *
     * @throws {Error} on cache parse error.
     *
     * @returns {object} account with cached token.
     */
    acquireTokenInCache({ scopes = types.DEFAULT_SCOPES } = {})
    {
        if (AuthenticationService.disabled)
            return null;

        try
        {
            return AuthenticationService.context.getCachedTokenInternal(scopes, AuthenticationService.context.getAccount());
        }
        catch (error)
        {
            if (error.errorCode === 'cannot_parse_cache')
                window.localStorage.clear();

            throw error;
        }
    },

    /**
     * Acquire new token for use.
     * JWT Decoding page: @see https://jwt.io/
     *
     * @param {object} [config] options.
     * @param {Array} [config.scopes] array of scopes allowed.
     * @param {string} [config.loginHint] preset account email.
     * @param {boolean} [config.forceTokenRefresh] forces to renew token on authentication.
     *
     * @returns {Promise<any>} token container.
     */
    acquireTokenSilent({ scopes = types.DEFAULT_SCOPES, loginHint, forceTokenRefresh } = {})
    {
        if (AuthenticationService.disabled)
            return null;

        if (AuthenticationService.acquireTokenPromise && AuthenticationService.context.getAcquireTokenInProgress())
            return AuthenticationService.acquireTokenPromise;

        AuthenticationService.context.setAcquireTokenInProgress(true);
        // sets token refresh uri as redirect uri for iframe load.
        AuthenticationService.context.config.auth.redirectUri = AuthenticationService.baseConfig.auth.tokenRefreshUri;

        return (AuthenticationService.acquireTokenPromise = AuthenticationService.context.acquireTokenSilent({
            scopes,
            loginHint: loginHint ?? AuthenticationService.getUserName(),
            forceRefresh: forceTokenRefresh
        }))
            .finally(() => AuthenticationService.context.setAcquireTokenInProgress(false));
    },

    /**
     * Acquire new token for use.
     * JWT Decoding page: @see https://jwt.io/
     *
     * @param {object} [config] options.
     * @param {Array} [config.scopes] array of scopes allowed.
     * @param {boolean} [config.forceTokenRefresh] forces to renew token from active directory.
     *
     * @returns {Promise<any>} token container.
     */
    acquireToken({ scopes = types.DEFAULT_SCOPES, forceTokenRefresh } = {})
    {
        return new Promise((resolve) =>
        {
            // tries to get cached token.
            if (!forceTokenRefresh)
            {
                const cached = AuthenticationService.acquireTokenInCache(scopes);

                if (cached && cached.accessToken && cached.idToken)
                {
                    resolve(cached);
                }
                else
                {
                    AuthenticationService.acquireTokenSilent({ scopes, forceTokenRefresh: true })
                        .then((account) => resolve(account))
                        .catch(() => AuthenticationService.login());
                }
            }
            else
            {
                AuthenticationService.acquireTokenSilent({ scopes, forceTokenRefresh })
                    .then((account) => resolve(account))
                    .catch(() => AuthenticationService.login());
            }
        })
            .catch((error) => AuthenticationService.Error = error);
    },

    /**
     * Single Sign-On flow.
     *
     * @param {object} [config] options.
     * @param {Array} [config.scopes] array of scopes allowed.
     * @param {string} [config.loginHint] preset account email.
     *
     * @returns {object} authentication state.
     */
    sso({
        scopes = types.DEFAULT_SCOPES,
        loginHint
    } = {})
    {
        if (AuthenticationService.disabled)
            return null;

        AuthenticationService.setState({ authenticating: true });

        return new Promise((resolve, reject) =>
        {
            AuthenticationService.context.ssoSilent({ loginHint, scopes })
                .then(() => resolve(AuthenticationService.setState({ authenticating: false, authenticated: true })))
                .catch(() =>
                {
                    AuthenticationService.login({ loginHint, scopes, forceTokenRefresh: true })
                        .then(() => resolve(AuthenticationService.setState({ authenticating: false, authenticated: true })))
                        .catch((error) => reject(AuthenticationService.setState({ authenticating: false, error })));
                });
        });
    },

    /**
     * Redirect to Microsoft AD login if user isn't authenticated.
     * On finishing, redirect to redirectUri.
     *
     * @param {object} [config] options.
     * @param {string} [config.type] login type (redirect or popup).
     *  Avoid using POPUP type on programatic/automatic login, should be used
     *  on user interaction (i.e. button push, page navigation triggered by user, etc.)
     * @param {Array} [config.scopes] permission scopes.
     * @param {string} [config.loginHint] preset account email.
     * @param {boolean} [config.forceTokenRefresh] forces to renew token on authentication.
     *
     * @returns {object} authentication state.
     */
    login({
        type = types.LOGIN_TYPE.REDIRECT,
        scopes = types.DEFAULT_SCOPES,
        loginHint,
        forceTokenRefresh = false
    } = {})
    {
        if (AuthenticationService.disabled)
            return null;

        // prevents multiple authentication processes.
        if (AuthenticationService.AuthenticatingPromise)
            return AuthenticationService.AuthenticatingPromise;

        return (AuthenticationService.AuthenticatingPromise = new Promise((resolve, reject) =>
        {
            if (AuthenticationService.isAuthenticated())
                return resolve(AuthenticationService.state);

            AuthenticationService.setState({ authenticating: true });

            AuthenticationService.context.acquireTokenSilent({ scopes })
                .then(() => resolve(AuthenticationService.setState({ authenticating: false, authenticated: true })))
                .catch(() =>
                {
                    // authentication process callback.
                    AuthenticationService.context.handleRedirectCallback((error, response) =>
                    {
                        if (response)
                            resolve(AuthenticationService.setState({ authenticating: false, authenticated: true }));
                        else
                            reject(AuthenticationService.setState({ authenticating: false, error }));
                    });

                    // redirect method login.
                    return AuthenticationService.context[type]({
                        scopes,
                        loginHint,
                        forceRefresh: forceTokenRefresh
                    })
                        // in popup case. Avoid to use on automatic login.
                        ?.then(() => resolve(AuthenticationService.setState({ authenticating: false, authenticated: true })))
                        ?.catch((error) => reject(AuthenticationService.setState({ authenticating: false, error })));
                });
        }));
    },

    /**
     * Whether authentication is disabled.
     *
     * @returns {boolean} true if disabled, false in otherwise.
     */
    isDisabled()
    {
        return AuthenticationService.disabled;
    },

    /**
     * Whether account is authenticated.
     *
     * @returns {boolean} true if authenticated, false in otherwise.
     */
    isAuthenticated()
    {
        return AuthenticationService.disabled || !!AuthenticationService.context.getAccount();
    },

    /**
     * Whether authentication is in progress.
     *
     * @returns {boolean} true if login is in progress, false in otherwise.
     */
    isAuthenticating()
    {
        const { authenticating } = AuthenticationService.state ?? {};

        return !AuthenticationService.disabled && (authenticating || AuthenticationService.context.getLoginInProgress());
    },

    /**
     * Logouts and redirects to postLogoutRedirectUri.
     */
    logout()
    {
        AuthenticationService.disabled || AuthenticationService.context.logout();
    },

    /**
     * Clear all access tokens in the cache.
     */
    clearCache()
    {
        AuthenticationService.disabled || AuthenticationService.context.clearCache();
    },

    /**
     * Returns current authority data.
     *
     * @returns {any} authority data.
     */
    getAuthority()
    {
        if (AuthenticationService.disabled)
            return null;

        return AuthenticationService.context.getAuthorityInstance();
    },

    /**
     * Returns current account data.
     *
     * @returns {any} account data.
     */
    getAccount()
    {
        if (AuthenticationService.disabled)
            return null;

        return AuthenticationService.context.getAccount();
    },

    /**
     * Returns current account identifier.
     *
     * @returns {string} account identifier.
     */
    getId()
    {
        if (AuthenticationService.disabled)
            return null;

        return AuthenticationService.context.getAccount()?.accountIdentifier;
    },

    /**
     * Returns current account userName.
     *
     * @returns {string} account userName.
     */
    getUserName()
    {
        if (AuthenticationService.disabled)
            return null;

        return AuthenticationService.context.getAccount()?.userName;
    },

    /**
     * Returns current account claims.
     *
     * @returns {any} account claims.
     */
    getClaims()
    {
        if (AuthenticationService.disabled)
            return null;

        return AuthenticationService.context.getAccount()?.idTokenClaims;
    },

    /**
     * Returns current account roles.
     *
     * @returns {any} account roles.
     */
    getRoles()
    {
        if (AuthenticationService.disabled)
            return null;

        const { idTokenClaims: claims } = AuthenticationService.getAccount() ?? {};

        if (Object.prototype.hasOwnProperty.call(claims, 'roles'))
            return claims.roles;

        return null;
    }
};

export default AuthenticationService;
