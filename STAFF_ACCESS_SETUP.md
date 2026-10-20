# Staff access setup

The staff pages use Firebase Authentication with custom claims. Do not assign staff roles in browser storage or expose a service-account credential in a `VITE_*` variable.

## Provision the first administrator

1. In Firebase Console, create the administrator's account through Authentication, or have them register at the student site first.
2. Create a service account for the Firebase project and store its complete JSON securely as `FIREBASE_SERVICE_ACCOUNT_JSON` in your local shell. Never commit the JSON or place it in a client-side environment variable.
3. Run `node scripts/set-user-role.js admin@example.com admin` from the project root, replacing the email with the intended administrator account.
4. Sign out and back in. Open `/admin` for the administrator or `/instructor` for an instructor.
5. The administrator can assign roles in **Admin → Accounts**. The changed user must sign out and back in before the new role is reflected in their ID token.

## Vercel server environment

Add `FIREBASE_SERVICE_ACCOUNT_JSON` to the Vercel project's server environment variables for every deployment environment that should manage accounts. It is used only by `/api/admin-users` and must not use a `VITE_` prefix.

## Shared live classes

1. Enable Cloud Firestore for the same Firebase project used by Authentication.
2. Deploy the checked-in rules with the Firebase CLI: `firebase deploy --only firestore:rules`.
3. Add the production and preview hostnames to Firebase Authentication's authorized domains as needed.

Signed-in users can read class records. Only accounts with trusted `instructor` or `admin` custom claims can create or update classes. An instructor can update only classes they own; only admins can delete classes. The account API verifies admin ID tokens on the server.

## Current data boundary

Only live-class records and user role profiles are shared through Firestore in this integration. Learning progress, submissions, attendance, classroom messages, and polls still use browser-local data and are not yet shared across devices. Firebase Authentication account deletion does not erase all locally cached learning data in every browser.
