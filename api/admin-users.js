import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  if (getApps().length) return getApps()[0];

  const serviceAccountValue = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountValue) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured");

  const serviceAccount = JSON.parse(serviceAccountValue);
  return initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

async function requireAdmin(req) {
  const authorization = req.headers.authorization ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return null;

  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(token);
    return decoded.role === "admin" ? decoded : null;
  } catch {
    return null;
  }
}

async function listAllUsers(auth) {
  const users = [];
  let pageToken;

  do {
    const page = await auth.listUsers(1000, pageToken);
    users.push(...page.users);
    pageToken = page.pageToken;
  } while (pageToken);

  return users.map((user) => ({
    id: user.uid,
    email: user.email ?? "",
    displayName: user.displayName ?? "",
    role: user.customClaims?.role === "admin" || user.customClaims?.role === "instructor"
      ? user.customClaims.role
      : "student",
    disabled: user.disabled,
    createdAt: user.metadata.creationTime,
    lastSignInAt: user.metadata.lastSignInTime ?? null,
  }));
}

export default async function handler(req, res) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return res.status(503).json({ error: "Firebase Admin is not configured on the server" });
  }

  const decoded = await requireAdmin(req);
  if (!decoded) return res.status(403).json({ error: "Administrator access required" });

  const app = getAdminApp();
  const auth = getAuth(app);

  try {
    if (req.method === "GET") {
      return res.status(200).json({ users: await listAllUsers(auth) });
    }

    if (req.method === "DELETE") {
      const uid = typeof req.body?.uid === "string" ? req.body.uid : "";
      if (!uid) return res.status(400).json({ error: "A user ID is required" });
      if (uid === decoded.uid) return res.status(400).json({ error: "You cannot remove your own administrator account" });

      await auth.deleteUser(uid);
      await getFirestore(app).doc(`users/${uid}`).delete();
      return res.status(200).json({ deleted: true, uid });
    }

    if (req.method === "PATCH") {
      const uid = typeof req.body?.uid === "string" ? req.body.uid : "";
      const role = req.body?.role;
      if (!uid || !["student", "instructor", "admin"].includes(role)) {
        return res.status(400).json({ error: "A user ID and valid role are required" });
      }
      if (uid === decoded.uid && role !== "admin") {
        return res.status(400).json({ error: "You cannot remove your own administrator role" });
      }

      const target = await auth.getUser(uid);
      await auth.setCustomUserClaims(uid, { ...target.customClaims, role });
      await getFirestore(app).doc(`users/${uid}`).set({
        uid,
        email: target.email ?? "",
        displayName: target.displayName ?? "",
        role,
        updatedAt: new Date(),
      }, { merge: true });
      return res.status(200).json({ updated: true, uid, role });
    }

    res.setHeader("Allow", "GET, PATCH, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    const code = error?.code;
    const status = code === "auth/user-not-found" ? 404 : 500;
    return res.status(status).json({ error: status === 404 ? "User not found" : "Unable to manage accounts" });
  }
}
