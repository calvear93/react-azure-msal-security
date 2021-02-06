/**
 * MSAL Microsoft Authentication configuration file.
 *
 * @see https://azuread.github.io/microsoft-authentication-library-for-js/docs/msal/modules/_configuration_.html
 *
 * Azure Active Directory App Registration should
 * has 'user.read' and 'openid' (for access tokens)
 * scopes allowed.
 *
 * @summary MSAL config file.
 * @author Alvear Candia, Cristopher Alejandro <calvear93@gmail.com>
 *
 * Created at     : 2020-04-15 19:51:39
 * Last modified  : 2020-12-04 15:19:24
 */

import types from './aad.types';

/**
 * Creates a config object for
 * MSAL authentication context.
 *
 * @export
 * @param {object} config MSAL auth config.
 * @param {string} config.tenantId organization Azure Object Id.
 * @param {string} config.clientId application Azure Object Id.
 * @param {string} [config.loginActionRedirect] redirect path after login.
 *  If navigateToRequestAfterLogin is false.
 * @param {string} [config.logoutActionRedirect] redirect path after logout.
 * @param {string} [config.tokenRefreshUri] path for renew auth token.
 *  Should be a empty page (null React component) and should be added to
 *  authentication routes in Azure App Registration.
 * @param {number} [config.tokenRenewalOffset] token renewal interval.
 * @param {string} [config.navigateToRequestAfterLogin] whether app redirects to previous path after login.
 * @param {number} [config.infoCacheDurationInDays] days for store user info cached.
 * @param {number} [config.photoCacheDurationInDays] days for store user photo cached.
 *
 * @returns {object} MSAL config object.
 */
export default function createConfig({
    clientId,
    tenantId,
    loginActionRedirect = '/',
    logoutActionRedirect = null,
    tokenRefreshUri = '/auth',
    tokenRenewalOffset = 120,
    navigateToRequestAfterLogin = true,
    infoCacheDurationInDays = 1,
    photoCacheDurationInDays = 3
})
{
    // login redirect URL.
    const LOGIN_ACTION_REDIRECT = loginActionRedirect && loginActionRedirect !== 'null'
        ? `${window.location.origin}${loginActionRedirect}`
        : window.location.origin;

    // logout redirect URL.
    const LOGOUT_ACTION_REDIRECT = logoutActionRedirect && logoutActionRedirect !== 'null'
        ? `${window.location.origin}${logoutActionRedirect}`
        : window.location.origin;

    // token acquisition route path.
    const TOKEN_REFRESH_URI = tokenRefreshUri && tokenRefreshUri !== 'null'
        ? `${window.location.origin}${tokenRefreshUri}`
        : window.location.origin;

    // offset needed to renew the token before expiry.
    const TOKEN_REFRESH_PERIOD = +tokenRenewalOffset;

    // navigates to request URL after authentication/login instead of redirect URL.
    const NAVIGATE_TO_REQUEST_URL_AFTER_LOGIN = navigateToRequestAfterLogin === true || navigateToRequestAfterLogin === 'true';

    /**
     *  - clientId: Client ID of your app registered with our Application registration portal (https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredAppsPreview) in Microsoft Identity Platform
     *  - authority: You can configure a specific authority, defaults to " " or "https://login.microsoftonline.com/common"
     *  - validateAuthority: Used to turn authority validation on/off. When set to true (default), MSAL will compare the application's authority against well-known URLs templates representing well-formed authorities. It is useful when the authority is obtained at run time to prevent MSAL from displaying authentication prompts from malicious pages.
     *  - knownAuthorities: If validateAuthority is set to True, this will be used to set the Trusted Host list. Defaults to empty array
     *  - redirectUri: The redirect URI of the application, this should be same as the value in the application registration portal.Defaults to `window.location.href`.
     *  - postLogoutRedirectUri: Used to redirect the user to this location after logout. Defaults to `window.location.href`.
     *  - navigateToLoginRequestUrl: Used to turn off default navigation to start page after login. Default is true. This is used only for redirect flows.
     *  - tokenRefreshUri: [CUSTOM] allows to exports token acquisition iframe route for token refresh logic.
     */
    const auth = {
        clientId,
        // https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-client-application-configuration
        authority: `https://login.microsoftonline.com/${tenantId}`,
        validateAuthority: false,
        redirectUri: LOGIN_ACTION_REDIRECT,
        postLogoutRedirectUri: LOGOUT_ACTION_REDIRECT,
        navigateToLoginRequestUrl: NAVIGATE_TO_REQUEST_URL_AFTER_LOGIN,
        tokenRefreshUri: TOKEN_REFRESH_URI
    };

    /**
     * Use this to configure the below cache configuration options.
     *
     * - cacheLocation: Used to specify the cacheLocation user wants to set. Valid values are "localStorage" and "sessionStorage"
     * - storeAuthStateInCookie: If set, MSAL store's the auth request state required for validation of the auth flows in the browser cookies. By default this flag is set to false.
     * - infoCacheDurationInDays: [CUSTOM] days for store user info in cache.
     * - photoCacheDurationInDays: [CUSTOM] days for store user photo in cache.
     */
    const cache = {
        cacheLocation: types.CACHE.LOCAL_STORAGE,
        storeAuthStateInCookie: false,
        infoCacheDurationInDays: +infoCacheDurationInDays,
        photoCacheDurationInDays: +photoCacheDurationInDays
    };

    /**
     * Library specific options.
     *
     * - logger: Used to initialize the Logger object;
     * - loadFrameTimeout: maximum time the library should wait for a frame to load
     * - tokenRenewalOffsetSeconds: sets the window of offset needed to renew the token before expiry
     * - navigateFrameWait: sets the wait time for hidden iFrame navigation
     */
    const system = {
        loadFrameTimeout: 12000,
        tokenRenewalOffsetSeconds: TOKEN_REFRESH_PERIOD,
        navigateFrameWait: 200
    };

    /**
     * App/Framework specific environment support.
     *
     * - unprotectedResources: Array of URI's which are unprotected resources. MSAL will not attach a token to outgoing requests that have these URI. Defaults to 'null'.
     * - protectedResourceMap: This is mapping of resources to scopes used by MSAL for automatically attaching access tokens in web API calls.A single access token is obtained for the resource. So you can map a specific resource path as follows: {"https://graph.microsoft.com/v1.0/me", ["user.read"]}, or the app URL of the resource as: {"https://graph.microsoft.com/", ["user.read", "mail.send"]}. This is required for CORS calls.
     */
    const framework = {
        unprotectedResources: [],
        protectedResourceMap: new Map()
    };

    // MSAL configuration.
    return {
        auth,
        cache,
        system,
        framework
    };
}
