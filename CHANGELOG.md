# Change Log

All notable changes to this project will be documented in this file.

## [2.1.2] - 2021-05-22
-   dependencies updated

## [2.1.1] - 2021-05-19
-   possible acquisition token fix

## [2.0.5] - 2021-04-25
-   improved token acquisition.
-   dependencies updated.

## [2.0.5] - 2021-04-02
-   MSAL updated.

## [2.0.4] - 2021-03-27
-   dependencies updated.

## [2.0.3] - 2021-02-27
-   enabled sourcemaps for compiled code.
-   .eslintignore added for build/dist folders.

## [2.0.2] - 2021-02-18
-   Changed minimum React version to 16.13.1.

## [2.0.1] - 2021-02-10
-   fixed blob handling for avatar in some scenarios.

## [2.0.0] - 2021-02-09
-   state handle reworked. Now, service has a centralized observer handling state changes.
-   added useAuthenticationState that handles in real-time session changes.
-   removed conditional authentication hooks. You can use useEffect for postLogin validations.
-   simplified init function.

## [1.0.4] - 2021-02-09
-   useLogin authenticated from state fixed.

## [1.0.3] - 2021-02-08
-   added useIsAuthenticated hook for simple check authentication state.

## [1.0.2] - 2021-02-08
-   added forceTokenRefresh param in useAcquireToken hook (forces to renew token from active directory).

## [1.0.1] - 2021-02-07
-   readme docs updated.

## [1.0.0] - 2021-02-06
-   MSAL authentication service.
-   Microsoft Graph service.
-   module initialization function from service.
-   hooks for login, logout and conditional login.
