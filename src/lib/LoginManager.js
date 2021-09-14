import {
  ACCOUNT_EXISTS,
  EMAIL_NEEDED,
  ENABLE_COOKIES,
  LINK_INVALID,
  LOGGING_IN,
  LOGIN_FAILED, LOGOUT_FAILED, SENDING_EMAIL,
  UNAUTHORIZED
} from './i18n';

import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signInWithRedirect,
  getRedirectResult,
  signOut
} from 'firebase/auth';
import Store from "./Store";

export default class LoginManager {
  CACHED_EMAIL = 'das89dbna';

  user = undefined;
  userPromise = undefined;

  listeners = [];

  constructor(handleRedirects=true, toastRelay=null) {
    this.addListener = this.addListener.bind(this);
    this.removeListener = this.removeListener.bind(this);

    this.store = new Store();

    this.toastRelay = toastRelay;
    if (!this.toastRelay) {
      this.toastRelay = {show: () => {}};
    }

    this.firebaseAuth = getAuth();

    this.firebaseAuth.useDeviceLanguage();

    let outerResolve;
    let outerReject;
    this.userPromise = new Promise((resolve, reject) => {
      outerResolve = resolve;
      outerReject = reject;
    });

    this.firebaseListenerCancellable = onAuthStateChanged(this.firebaseAuth, async(user) => {
      try {
        this.user = user;

        if (user) {
          const idTokenResult = await user.getIdTokenResult();
          this.claims = idTokenResult.claims;
        } else {
          this.claims = [];
        }

        for (const listener of this.listeners) {
          listener(user);
        }
        outerResolve();
      } catch (e) {
        outerReject(e);
      }
    });

    if (handleRedirects) {
      this._handleEmailSignInRedirectResult();
      this._handleAuthProviderRedirectResult();
    }
  }

  destruct() {
    if (this.firebaseListenerCancellable) {
      this.firebaseListenerCancellable();
    }
  }

  async awaitUser() {
    await this.userPromise;
    return this.user;
  }

  addListener(listener) {
    this.listeners.push(listener);
    if (this.user !== undefined) {
      listener(this.user);
    }
  }

  removeListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  async loginWithEmail(email, onEmailSent, onEmailFailed) {
    const actionCodeSettings = {
      url: window.location.href,
      handleCodeInApp: true
    };

    try {
      this.toastRelay.show(SENDING_EMAIL, true);
      await sendSignInLinkToEmail(this.firebaseAuth, email, actionCodeSettings);
      this.toastRelay.show(null);
      this.store.setPermanent(this.CACHED_EMAIL, email);
      onEmailSent();
    } catch (e) {
      console.error(e);
      this.toastRelay.show(null);
      const errorCode = e.code;
      if (errorCode === 'auth/unauthorized-continue-uri') {
        this.toastRelay.show(UNAUTHORIZED, false, 5000);
        console.error('NOT ALLOWED ON LOCALHOST. DEPLOY TO TEST.');
      } else {
        this.toastRelay.show(LOGIN_FAILED, false, 4000);
      }
      onEmailFailed();
    }
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    await this._loginWithProvider(provider);
  }

  async logout() {
    try {
      this.store.removePermanent(this.CACHED_EMAIL);
      await signOut(this.firebaseAuth);
    } catch (e) {
      console.error(e);
      this.toastRelay.show(LOGOUT_FAILED, false, 5000);
    }
  }

  async _loginWithProvider(provider) {
    try {
      await signInWithRedirect(this.firebaseAuth, provider);
      await this._assertRedirect();
    } catch (e) {
      const errorCode = e.code;
      if (errorCode === 'auth/unauthorized-domain') {
        this.toastRelay.show(UNAUTHORIZED, false, 5000);
        console.error('NOT ALLOWED ON LOCALHOST. DEPLOY TO TEST.');
      } else {
        this.toastRelay.show(LOGIN_FAILED, false, 4000);
      }
      console.error(e);
    }
  }

  async _handleEmailSignInRedirectResult() {
    if (!isSignInWithEmailLink(this.firebaseAuth, window.location.href)) {
      return;
    }

    const user = await this.awaitUser();

    if (user) {
      return;
    }

    let email = this.store.getPermanent(this.CACHED_EMAIL);

    if (!email) {
      // This happens when email link is clicked on a different device.
      email = window.prompt(EMAIL_NEEDED);
    }

    try {
      this.toastRelay.show(LOGGING_IN, true);
      await signInWithEmailLink(this.firebaseAuth, email, window.location.href);
      this.store.removePermanent(this.CACHED_EMAIL);
      window.location.href = window.location.href.split('?')[0]; // remove email login query param.
      this.toastRelay.show(null);
    } catch (e) {
      this.toastRelay.show(null);
      if (e.code === 'auth/invalid-action-code') {
        this.toastRelay.show(LINK_INVALID, false, 4000);
      } else if (e.code === 'auth/invalid-email') {
        this.toastRelay.show(LOGIN_FAILED, false, 4000);
      } else if (e.code === 'auth/argument-error') {
        this.toastRelay.show(LOGIN_FAILED, false, 4000);
      }
      console.error(e);
    }
  }

  async _handleAuthProviderRedirectResult() {
    try {
      await getRedirectResult(this.firebaseAuth);
    } catch (e) {
      this.toastRelay.show(null);

      const errorCode = e.code;
      const errorMessage = e.message;

      if (errorCode === 'auth/operation-not-supported-in-this-environment') {
        this.toastRelay.show(ENABLE_COOKIES, false, 5000);
      } else if (errorCode === 'auth/account-exists-with-different-credential') {
        this.toastRelay.show(ACCOUNT_EXISTS, false, 5000);
      } else {
        this.toastRelay.show(LOGIN_FAILED, false, 4000);
      }
      // const email = error.email;
      // const credential = error.credential;
      console.error('ERROR IN AUTH PROVIDER REDIRECT: ' + errorMessage + '. ' + errorCode);
    }
  }

  /**
   * We expect a redirect. If that never happens, likely cookies are disabled.
   * @returns {Promise<boolean>}
   */
  async _assertRedirect() {
    setTimeout(() => {
      this.toastRelay.show(ENABLE_COOKIES, true, 6000);
    }, 2000);
  }
}
