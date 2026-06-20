const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const webpush = require('web-push');
const admin = require('firebase-admin');
const cron = require('node-cron');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Setup Web Push
webpush.setVapidDetails(
  process.env.VAPID_MAILTO,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } else {
    const serviceAccountPath = path.join(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT || 'serviceAccountKey.json');
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = require(serviceAccountPath);
    }
  }
} catch (error) {
  console.error("Failed to load Firebase Service Account:", error);
}

let db = null;
if (serviceAccount) {
  initializeApp({
    credential: cert(serviceAccount)
  });
  db = getFirestore();
  console.log("Firebase Admin Initialized successfully.");
} else {
  console.error("Firebase Admin not initialized!");
}

// Basic Health Check Endpoint
app.get('/', (req, res) => {
  res.send('Habit Tracker Push Notification Server is running!');
});

// Debug endpoint: see what Firestore actually contains
app.get('/debug', async (req, res) => {
  if (!db) return res.json({ error: "DB not initialized" });
  try {
    const result = {};
    
    // Find all habits via collectionGroup
    const habitsSnap = await db.collectionGroup('habits').get();
    for (const h of habitsSnap.docs) {
      const uid = h.ref.parent.parent.id;
      if (!result[uid]) result[uid] = { habits: [], pushSubscription: false };
      
      const data = h.data();
      result[uid].habits.push({ 
        id: h.id, 
        name: data.name, 
        reminderTime: data.reminderTime,
        reminder: data.reminder,
        status: data.status
      });
    }
    
    // Find all subscriptions via collectionGroup
    const pushSnap = await db.collectionGroup('push').get();
    for (const p of pushSnap.docs) {
      if (p.id === 'subscription') {
        const uid = p.ref.parent.parent.id;
        if (!result[uid]) result[uid] = { habits: [], pushSubscription: false };
        result[uid].pushSubscription = true;
      }
    }
    
    res.json(result);
  } catch (err) {
    res.json({ error: err.message });
  }
});

// Endpoint to test push notifications manually
app.post('/test-push', async (req, res) => {
  const { subscription, payload } = req.body;
  if (!subscription) return res.status(400).json({ error: "No subscription provided" });

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    res.status(200).json({ success: true, message: "Push sent successfully" });
  } catch (error) {
    console.error("Error sending push:", error);
    res.status(500).json({ error: "Failed to send push notification", details: error });
  }
});

// Cron Job: Runs every minute
cron.schedule('* * * * *', async () => {
  console.log(`[Cron] Running minute check at ${new Date().toISOString()}`);
  if (!db) {
    console.log("[Cron] Skipping because Firebase DB is not initialized.");
    return;
  }

  const now = new Date();
  const utcHours = String(now.getUTCHours()).padStart(2, '0');
  const utcMinutes = String(now.getUTCMinutes()).padStart(2, '0');
  const currentUTCTime = `${utcHours}:${utcMinutes}`;

  try {
    const habitsSnapshot = await db.collectionGroup('habits')
      .where('reminderTimeUTC', '==', currentUTCTime)
      .get();

    console.log(`[Cron] Found ${habitsSnapshot.size} habits matching UTC time ${currentUTCTime}`);

    if (!habitsSnapshot.empty) {
      // Group habits by user to send one push per user or handle subscriptions efficiently
      const habitsByUser = {};
      for (const doc of habitsSnapshot.docs) {
        // Doc ref path: users/{uid}/habits/{habitId}
        const uid = doc.ref.parent.parent.id;
        if (!habitsByUser[uid]) habitsByUser[uid] = [];
        habitsByUser[uid].push(doc.data());
      }

      for (const [uid, userHabits] of Object.entries(habitsByUser)) {
        const subDoc = await db.collection('users').doc(uid).collection('push').doc('subscription').get();
        if (!subDoc.exists) {
          console.warn(`[Cron Warning] User ${uid} has matching habits but NO Push Subscription saved!`);
        } else {
          const subscription = subDoc.data();
          
          for (const habit of userHabits) {
            const payload = {
              title: "Habit Reminder 🔔",
              body: `It's time for: ${habit.name}`,
              url: '/'
            };
            
            try {
              console.log(`[Push Debug] Attempting to send webpush to endpoint: ${subscription.endpoint}`);
              await webpush.sendNotification(subscription, JSON.stringify(payload));
              console.log(`[Push Debug] SUCCESS! Web Push delivered to user ${uid} for habit: ${habit.name}`);
            } catch (err) {
              console.error(`[Push Debug Error] Failed to send push to user ${uid} for habit ${habit.name}.`);
              console.error(`[Push Debug Error] Status Code: ${err.statusCode}`);
              console.error(`[Push Debug Error] Error Details:`, err);
              if (err.statusCode === 410 || err.statusCode === 404) {
                console.log(`[Push Debug] Deleting expired/invalid subscription for user ${uid}.`);
                await db.collection('users').doc(uid).collection('push').doc('subscription').delete();
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("[Cron] Error checking reminders:", error);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  console.log(`🔑 VAPID Public Key: ${process.env.VAPID_PUBLIC_KEY}`);
});
