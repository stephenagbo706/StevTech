import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const email = process.argv[2]?.trim().toLowerCase();
const role = process.argv[3];
const serviceAccountValue = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!email || !["admin", "instructor", "student"].includes(role)) {
  console.error("Usage: node scripts/set-user-role.js <email> <admin|instructor|student>");
  process.exit(1);
}
if (!serviceAccountValue) {
  console.error("Set FIREBASE_SERVICE_ACCOUNT_JSON to the service-account JSON from Firebase Console.");
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountValue);
const app = getApps()[0] ?? initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
});
const auth = getAuth(app);
const user = await auth.getUserByEmail(email);
await auth.setCustomUserClaims(user.uid, { ...user.customClaims, role });
await getFirestore(app).doc(`users/${user.uid}`).set({
  uid: user.uid,
  email: user.email ?? email,
  displayName: user.displayName ?? "",
  role,
  updatedAt: new Date(),
}, { merge: true });

console.log(`Assigned ${role} role to ${email}. The user must sign out and back in to refresh the role.`);
