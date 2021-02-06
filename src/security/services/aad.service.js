/**
 * MSAL Microsoft Authentication service.
 *
 * @summary MSAL service.
 * @author Alvear Candia, Cristopher Alejandro <calvear93@gmail.com>
 *
 * Created at     : 2020-05-23 19:53:33
 * Last modified  : 2020-12-04 15:19:23
 */

import * as Msal from 'msal';
import { createConfig, types } from '../config';

export default {

    // MSAL base config.
    BaseConfig: null,

    // authentication context.
    Context: null,

    // saves current token acquisition request.
    AcquireTokenPromise: null,

    // stores authentication process promise.
    AuthenticatingPromise: null,

    /**
     * Initializes MSAL authentication context.
     *
     * All config properties accepts
     * environment variables values.
     *
     * @param {object} args MSAL auth config.
     * @param {object} args.disabled whether authentication is disabled globally.
     * @param {object} args.config MSAL auth config.
     * @param {string} args.config.tenantId organization Azure Object Id.
     * @param {string} args.config.clientId application Azure Object Id.
     * @param {string} args.config.loginActionRedirect redirect path after login.
     *  If navigateToRequestAfterLogin is false.
     * @param {string} args.config.logoutActionRedirect redirect path after logout.
     * @param {string} args.config.tokenRefreshUri path for renew auth token.
     *  Should be a empty page (null React component) and should be added to
     *  authentication routes in Azure App Registration.
     * @param {number} args.config.tokenRenewalOffset token renewal interval.
     * @param {string} args.config.navigateToRequestAfterLogin whether app redirects to previous path after login.
     */
    init({ disabled = false, ...config })
    {
        this.Disabled = disabled;

        if (!disabled)
        {
            this.BaseConfig = createConfig(config);
            this.Context = new Msal.UserAgentApplication(this.BaseConfig);
        }
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
        if (this.Disabled)
            return null;

        try
        {
            return this.Context.getCachedTokenInternal(scopes, this.Context.getAccount());
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
        if (this.Disabled)
            return null;

        if (this.AcquireTokenPromise && this.Context.getAcquireTokenInProgress())
            return this.AcquireTokenPromise;

        this.Context.setAcquireTokenInProgress(true);
        // sets token refresh uri as redirect uri for iframe load.
        this.Context.config.auth.redirectUri = this.BaseConfig.auth.tokenRefreshUri;

        return (this.AcquireTokenPromise = this.Context.acquireTokenSilent({
            scopes,
            loginHint: loginHint ?? this.getUserName(),
            forceRefresh: forceTokenRefresh
        }))
            .finally(() => this.Context.setAcquireTokenInProgress(false));
    },

    /**
     * Acquire new token for use.
     * JWT Decoding page: @see https://jwt.io/
     *
     * @param {object} [config] options.
     * @param {Array} [config.scopes] array of scopes allowed.
     *
     * @returns {Promise<any>} token container.
     */
    acquireToken({ scopes = types.DEFAULT_SCOPES } = {})
    {
        return new Promise((resolve, reject) =>
        {
            const cached = this.acquireTokenInCache(scopes);

            if (cached && cached.accessToken)
                resolve(cached);

            this.acquireTokenSilent({ scopes })
                .then((account) => resolve(account))
                .catch((err) => reject(err));
        });
    },

    /**
     * Single Sign-On flow.
     *
     * @param {object} [config] options.
     * @param {Array} [config.scopes] array of scopes allowed.
     * @param {string} [config.loginHint] preset account email.
     *
     * @returns {boolean} account data if is authenticated, error on failure.
     */
    sso({
        scopes = types.DEFAULT_SCOPES,
        loginHint
    } = {})
    {
        if (this.Disabled)
            return null;

        return new Promise((resolve, reject) =>
        {
            this.Context.ssoSilent({ loginHint, scopes })
                .then((account) => resolve(account))
                .catch(() =>
                {
                    this.login({ loginHint, scopes, forceTokenRefresh: true })
                        .then((account) => resolve(account))
                        .catch((err) => reject(err));
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
     * @returns {boolean} account data if is authenticated, error on failure.
     */
    login({
        type = types.LOGIN_TYPE.REDIRECT,
        scopes = types.DEFAULT_SCOPES,
        loginHint,
        forceTokenRefresh = false
    } = {})
    {
        if (this.Disabled)
            return null;

        // prevents multiple authentication processes.
        if (this.AuthenticatingPromise)
            return this.AuthenticatingPromise;

        return (this.AuthenticatingPromise = new Promise((resolve, reject) =>
        {
            if (this.Context.getAccount())
                return resolve(this.Context.getAccount());

            this.Context.acquireTokenSilent({ scopes })
                .then(() => resolve(this.Context.getAccount()))
                .catch(() =>
                {
                    // authentication process callback.
                    this.Context.handleRedirectCallback((error, response) =>
                    {
                        if (response)
                            resolve(this.Context.getAccount());
                        else
                            reject(error);
                    });

                    // redirect method login.
                    return this.Context[type]({
                        scopes,
                        loginHint,
                        forceRefresh: forceTokenRefresh
                    })
                        // in popup case. Avoid to use on automatic login.
                        ?.then(() => resolve(this.Context.getAccount()))
                        ?.catch((error) => reject(error));
                });
        }));
    },

    /**
     * Whether account is authenticated.
     *
     * @returns {boolean} true if authenticated, false in otherwise.
     */
    isAuthenticated()
    {
        return this.Disabled || !!this.Context.getAccount();
    },

    /**
     * Logouts and redirects to postLogoutRedirectUri.
     */
    logout()
    {
        this.Disabled || this.Context.logout();
    },

    /**
     * Clear all access tokens in the cache.
     */
    clearCache()
    {
        this.Disabled || this.Context.clearCache();
    },

    /**
     * Returns current account data.
     *
     * @returns {any} account data.
     */
    getAccount()
    {
        if (this.Disabled)
            return null;

        return this.Context.getAccount();
    },

    /**
     * Returns current account identifier.
     *
     * @returns {string} account identifier.
     */
    getId()
    {
        if (this.Disabled)
            return null;

        return this.Context.getAccount()?.accountIdentifier;
    },

    /**
     * Returns current account userName.
     *
     * @returns {string} account userName.
     */
    getUserName()
    {
        if (this.Disabled)
            return null;

        return this.Context.getAccount()?.userName;
    },

    /**
     * Returns current account claims.
     *
     * @returns {any} account claims.
     */
    getClaims()
    {
        if (this.Disabled)
            return null;

        return this.Context.getAccount()?.idTokenClaims;
    },

    /**
     * Returns current account roles.
     *
     * @returns {any} account roles.
     */
    getRoles()
    {
        if (this.Disabled)
            return null;

        const claims = this.Context.getAccount()?.idTokenClaims;

        if (Object.prototype.hasOwnProperty.call(claims, 'roles'))
            return claims.roles;

        return null;
    }
};
