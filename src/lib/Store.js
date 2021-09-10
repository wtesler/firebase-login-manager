/**
 * A persistence store which can hold values permanently.
 */
export default class Store {
  setPermanent(key, value) {
    if (typeof (value) === "object") {
      value = JSON.stringify(value);
    }
    window.localStorage.setItem(key, value);
  }

  getPermanent(key) {
    let value = window.localStorage.getItem(key);
    try {
      return JSON.parse(value);
    } catch (e) {
      if (value === 'undefined') {
        return undefined
      } else if (value === 'null') {
        return null;
      } else if (value === 'true') {
        return true;
      } else if (value === 'false') {
        return false;
      } else {
        return value;
      }
    }
  }

  removePermanent(key) {
    window.localStorage.removeItem(key);
  }
}
