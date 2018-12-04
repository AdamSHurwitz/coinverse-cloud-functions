const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

// Retrieve the audiocast Cloud Storage path.
exports.getAudiocast = functions.https.onCall((data, context) => {
    //TODO: Check if audiocast exists.
    //TODO: If exists, return file path.
    //TODO: If doesn't exist, create audiocast, save to Cloud Storage, and return path
    console.log("Get Audiocast:" + data.id)
    return {
        filePath: "cloudStorage/someFilePath",
      };
});