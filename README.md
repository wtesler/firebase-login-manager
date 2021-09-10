## firebase-login-manager

A login manager to handle the state of the user in a firebase website.

### Usage
Construct the `LoginManager` at a high-level in your application.
The first constructor parameter is `handleRedirects`. Set it to true
for your main login manager to handle email/federated logins with that
login manager. The second parameter is `toastRelay` which is optional
and comes from `react-root-overlays` package.

The public functions of the `LoginManager` are:

`async awaitUser`: returns the user or null.
`addListener`: Add a listener that receives the up-to-date user.
`removeListener`: Remove the listener.
`loginWithEmail`: Request a email be sent that allows for logging in with email.
`loginWithGoogle`: Start a federated Google login.
`logout`: Logout

### For Developer

Remember to npm run build before deploying.