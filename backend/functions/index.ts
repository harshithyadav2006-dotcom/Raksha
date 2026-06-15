import * as functions from "firebase-functions";

// Example Cloud Function — expand as needed for Raksha Nexus backend logic
export const helloRaksha = functions.https.onRequest((_req, res) => {
  res.json({ message: "Raksha Nexus backend is running." });
});

// Future: SOS alert handler, push notifications, AI triage, etc.
