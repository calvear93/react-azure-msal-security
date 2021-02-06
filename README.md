# React Azure MSAL Security
### Azure Active Directory security module using MSAL

React library for application security (using MSAL) that eases application protection with Azure session JWT using MSAL library.
Exposes multiples hooks for login, logout and secure components.

## Structure 📋

```bash
├── README.md
├── LICENCE.md
├── CHANGELOG.md
├── .vscode/ # vscode shared development config
├── src/
│   ├── security/
│   │   ├── config/
│   │   │   ├── aad.config.js # MSAL config initialization
│   │   │   └── aad.types.js # AAD and Ms Graph constants
│   │   ├── services/
│   │   │   ├── aad-graph.service.js # basic graph service for user info and avatar
│   │   │   └── aad.service.js # service for handle login, sso and token acquisition
│   │   ├── auth.hook.js # module hooks
│   │   └── cache.util.js # util for persist graph info
│   └── index.js
├── package.json
├── jsconfig.js
├── .babelrc
├── .eslintrc.json
└── .prettierrc.json
```

-   **config**: contains context config and MSAL constants.
-   **aad.service.js**: main service. Handles MSAL context, session state, login, logout and token acquisition.
-   **aad-graph.service.js**: handles Microsoft Graph calls, like user detailed info and profile avatar.
-   **auth.hooks.js**: exposed hooks for login, logout and secure components.
-   **index.js**: exports router, hooks and routes handler/service.

## How To Configure

First, you should [register](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app) a new Azure Active Directory Application in Azure Portal.

In **Authentication** section add a new platform, selecting Single-Page Application (SPA) and setting up Redirect URIs only, with host (base URL) and token auth URL, for example, for dev:
- https://localhost:3000/
- https://localhost:3000/auth

Also, in this section, enable **Access tokens** and **ID tokens** in **Implicit grant** sub-section.

Finally, you should configure permissions in **API permissions** section, with the minimum permission _User.Read_, although ideally _profile_ and _openid_ for correct token acquisition.

## How To Use

This module, exposes many hooks for handle login, logout and secure React components.

### App configuration

In your **App.jsx** or **App.router.jsx** you should initialize the authentication service.

```javascript
import { AuthenticationService } from 'modules/security';

// initializes Microsoft Active Directory authentication service.
AuthenticationService.init({
    disabled: false,
    clientId: '2a85c521-02fc-4796-8ecc-eaa13eee2e7b', // registered app id from azure
    tenantId: 'ba3947ca-abb7-402e-b1d1-c9284608f497', // maybe common, organizations or consumers also
    loginActionRedirect: '/',
    logoutActionRedirect: null,
    tokenRefreshUri: '/auth', // should exists a blank route in your app
    tokenRenewalOffset: 120,
    navigateToRequestAfterLogin: true
});

// main react component
export default () => {
    return (
        <div>
            <h1>Welcome to My App</h1>
        </div>
    );
}
```

For tenantId also see [MSAL CLient Config](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-client-application-configuration)

### Automatic Login

```javascript
import { useAuthentication } from 'modules/security';

// react component
export default () => {
    const { authenticated, authenticating, error } = useAuthentication();

    if(authenticating)
        return <div>Authenticating...</div>;

    if(!authenticated)
        return <div>403: Not Authorized - {error.message}</div>;

    return (
        <div>
            <h1>Welcome to My App</h1>
        </div>
    );
}
```

### Manual Login

```javascript
import { Redirect } from 'react-router-dom';
import { useLogin } from 'modules/security';

// react component
export default () => {
    const [ login, { authenticated, authenticating, error }] = useLogin();

    if(authenticating)
        return <div>Authenticating...</div>;

    if(!authenticated)
        return <div>403: Not Authorized - {error.message}</div>;

    if(authenticated)
        return <Redirect to='/home'>;

    return (
        <div>
            <button onClick={login}>Log In</button>
        </div>
    );
}
```

### Logout

```javascript
import { useLogout } from 'modules/security';

// react component
export default () => {
    const logout = useLogout();

    return (
        <div>
            <button onClick={logout}>Log Out</button>
        </div>
    );
}
```

### Conditional Login

Both, automatic and manual login, has the possibility to add a condition after AAD authentication, for custom user or role validation.
The conditional validation should be an asynchronous function resolving a boolean.

```javascript
import { UserApi } from 'services/api/user';
import { useConditionalAuthentication } from 'modules/security';

async function ValidateRegisteredUserInDb(aadService) => {
    // retrieves current logged user principal name (email).
    const upn = aadService.getUserName();
    // validates with custom service user existence.
    const isValid = await UserApi.validate(upn);

    return isValid;
}

// react component
export default () => {
    const {
        authenticated,
        authenticating,
        error
    } = useConditionalAuthentication(ValidateRegisteredUserInDb);

    if(authenticating)
        return <div>Authenticating...</div>;

    if(!authenticated)
        return <div>403: Not Authorized - {error.message}</div>;

    return (
        <div>
            <h1>Welcome to My App</h1>
        </div>
    );
}
```

### Acquire Token

You can acquire a JWT access token for API securing.

```javascript
import { useState, useEffect } from 'react';
import { useAcquireToken } from 'modules/security';

// react component
export default () => {
    const [ token, setToken ] = useState();
    const acquireToken = useAcquireToken();

    useEffect(() => {
        acquireToken()
            .then((tkn) => setToken(tkn));
    }, [])

    return (
        <div>
            <h1>Welcome to My App</h1>
        </div>
    );
}
```

### Graph Info

You can retrieves user account detailed info and profile avatar from Microsoft Graph api with hooks.

```javascript
import { useAccountInfo } from 'modules/security';

// react component
export default () => {
    const { loading, info, error } = useAccountInfo();

    if(loading)
        return <div>Loading User Info...</div>

    if(error)
        return <div>User info cannot be loaded: {error.message}</div>

    return (
        <div>
            <h1>User Info</h1>
            <h3>Name: {info.displayName}</h3>
        </div>
    );
}
```

```javascript
import { useAccountAvatar } from 'modules/security';

// react component
export default () => {
    const { loading, avatar, error } = useAccountAvatar();

    if(loading)
        return <div>Loading User Avatar...</div>

    if(error)
        return <div>User avatar cannot be loaded: {error.message}</div>

    return (
        <div>
            <img alt='user-avatar' src={avatar} />
        </div>
    );
}
```

## Linting 🧿

Project uses ESLint, for code formatting and code styling normalizing.

-   **eslint**: JavaScript and React linter with Airbnb React base config and some other additions.
-   **prettier**: optional Prettier config.

For correct interpretation of linters, is recommended to use [Visual Studio Code](https://code.visualstudio.com/) as IDE and install the plugins in .vscode folder at 'extensions.json', as well as use the config provided in 'settings.json'

## Changelog 📄

For last changes see [CHANGELOG.md](CHANGELOG.md) file for details.

## Built with 🛠️

-   [React](https://reactjs.org/) - the most fabulous JavaScript framework.
-   [MSAL](https://github.com/AzureAD/microsoft-authentication-library-for-js) - Microsoft Authentication Library for JavaScript.
-   [axios](https://github.com/axios/axios) - Promise based HTTP client.

## License 📄

This project is licensed under the MIT License - see [LICENSE.md](LICENSE.md) file for details.

---

⌨ by [Alvear Candia, Cristopher Alejandro](https://github.com/calvear93)
