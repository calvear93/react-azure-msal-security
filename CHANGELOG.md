# Change Log

All notable changes to this project will be documented in this file.

## [2.0.4] - 2021-03-27
-   updated dependencies.

## [2.0.3] - 2021-02-27
-   Enabled sourcemaps for compiled code.
-   .eslintignore added for build/dist folders.

## [2.0.2] - 2021-02-18
-   Changed minimum React version to 16.13.1.

## [2.0.1] - 2021-02-10
-   Fixed blob handling for avatar in some scenarios.

## [2.0.0] - 2021-02-09
-   State handle reworked. Now, service has a centralized observer handling state changes.
-   Added useAuthenticationState that handles in real-time session changes.
-   Removed conditional authentication hooks. You can use useEffect for postLogin validations.
-   Simplified init function.

## [1.0.4] - 2021-02-09
-   useLogin authenticated from state fixed.

## [1.0.3] - 2021-02-08
-   Added useIsAuthenticated hook for simple check authentication state.

## [1.0.2] - 2021-02-08
-   Added forceTokenRefresh param in useAcquireToken hook (forces to renew token from active directory).

## [1.0.1] - 2021-02-07
-   Readme docs updated.

## [1.0.0] - 2021-02-06
-   MSAL authentication service.
-   Microsoft Graph service.
-   Module initialization function from service.
-   Hooks for login, logout and conditional login.
