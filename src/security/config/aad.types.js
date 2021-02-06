/**
 * MSAL Microsoft Authentication constants.
 *
 * @summary MSAL constants.
 * @author Alvear Candia, Cristopher Alejandro <calvear93@gmail.com>
 *
 * Created at     : 2020-05-23 19:54:31
 * Last modified  : 2020-11-26 12:11:36
 */

const types = {
    // Login types.
    LOGIN_TYPE: {
        REDIRECT: 'loginRedirect',
        POPUP: 'loginPopup'
    },
    // Cache location options supported.
    CACHE: {
        // browsers local storage to store the cache
        LOCAL_STORAGE: 'localStorage',
        // browsers session storage to store the cache
        SESSION_STORAGE: 'sessionStorage'
    },
    // Microsoft Active Directory resources APIs.
    RESOURCES: {
        MICROSOFT_GRAPH: 'https://graph.microsoft.com/',
        OFFICE_365_MAIL: 'https://outlook.office.com/',
        AZURE_KEY_VAULT: 'https://vault.azure.net/'
    },
    // https://docs.microsoft.com/en-us/graph/api/resources/user?view=graph-rest-1.0
    ATTRIBUTES: [
        'id',
        'displayName',
        'givenName',
        'surname',
        'mailNickname',
        'userPrincipalName',
        'userType',
        'birthday',
        'jobTitle',
        'mail',
        'mobilePhone',
        'companyName',
        'department',
        'country',
        'city',
        'officeLocation',
        'streetAddress',
        'onPremisesExtensionAttributes',
        'businessPhones',
        'otherMails',
        'onPremisesDomainName',
        'createdDateTime'
    ],
    // Permission scopes for resources.
    SCOPES: {
        DEFAULT: '.default',
        EMAIL: 'email',
        PROFILE: 'profile',
        OFFLINE_ACCESS: 'offline_access',
        OPEN_ID: 'open_id',
        DIRECTORY: {
            READ: 'directory.read',
            READ_ALL: 'directory.read.all',
            WRITE: 'directory.write',
            READ_WRITE_ALL: 'directory.readwrite.all'
        },
        USER: {
            READ: 'user.read',
            READ_BASIC: 'user.readbasic.all',
            READ_ALL: 'user.read.all',
            READ_WRITE: 'user.readwrite',
            READ_WRITE_ALL: 'user.readwrite.all',
            EXPORT_ALL: 'user.export.all',
            INVITE: 'user.invite',
            IMPERSONATION: 'user_impersonation'
        },
        BOOKINGS: {
            READ: 'bookings.read.all',
            MANAGE: 'bookings.manage.all',
            READ_WRITE: 'bookings.readwrite.all'
        },
        CALENDAR: {
            READ: 'calendar.read',
            READ_SHARED: 'calendar.read.shared',
            READ_WRITE: 'calendar.readwrite',
            READ_WRITE_SHARED: 'calendar.readwrite.shared'
        },
        MAIL: {
            READ: 'mail.read',
            READ_SHARED: 'mail.read.shared',
            READ_BASIC: 'mail.readbasic',
            READ_WRITE: 'mail.readwrite',
            READ_WRITE_SHARED: 'mail.readwrite.shared',
            SEND: 'mail.send',
            SEND_SHARED: 'mail.send.shared'
        },
        CONTACTS: {
            READ: 'contacts.read',
            READ_SHARED: 'contacts.read.shared',
            READ_WRITE: 'contacts.readwrite',
            READ_WRITE_SHARED: 'contacts.readwrite.shared'
        },
        GROUPS: {
            READ: 'groups.read',
            READ_WRITE_ALL: 'groups.readwrite.all'
        }
    }
};

// default AAD authentication permission scopes.
types.DEFAULT_SCOPES = [ types.SCOPES.USER.READ ];

export default types;
