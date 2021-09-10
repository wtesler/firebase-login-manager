export let ACCOUNT_EXISTS = 'Profiles exists. Use an alternate login method.';
export let EMAIL_NEEDED = 'Please provide your email address again for confirmation';
export let ENABLE_COOKIES = 'Enable cookies for proper experience';
export let LINK_INVALID = 'Link no longer valid';
export let LOGGING_IN = 'Logging In...';
export let LOGIN_FAILED = 'Login Failed';
export let LOGOUT_FAILED = 'Logout Failed';
export let UNAUTHORIZED = 'Unauthorized';
export let SENDING_EMAIL = 'Sending Email...';

function localize(code) {
  if (code.startsWith('zh')) {

  } else if (code.startsWith('es')) {

  }
}

class i18n {
  constructor() {
    try {
      const languageCode = window.navigator.language;
      localize(languageCode);
    } catch (e) {
      console.warn('Localization Failed');
      console.warn(e);
    }
  }
}

const i18nInstance = new i18n();

export default i18nInstance;
