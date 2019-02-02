const admin = require('firebase-admin');
const functions = require('firebase-functions');
const firebase_tools = require('firebase-tools');
const getAudiocast = require('./audiocast');
admin.initializeApp(); 
const promise = (promise) => promise
  .then(data => [null, data])
  .catch(error => [error, null]);

exports.getAudiocast = functions.https.onRequest((req, res) => {
  getAudiocast.handler(req, res);
});

/**
 * Initiate a recursive delete of documents at a given path.
 *
 * This delete is NOT an atomic operation and it's possible
 * that it may fail after only deleting some documents.
 *
 * @param {string} data.path the document or collection path to delete.
 */
exports.deleteUser = functions
  .runWith({timeoutSeconds: 540, memory: '2GB'})
  .https.onCall((data, context) => {
    if (context.auth.uid !== data.userId)
      throw new functions.https.HttpsError(
        'permission-denied','Must be an administrative user to initiate delete.');
    const path = data.path;
    console.log(`User ${context.auth.uid} has requested to delete path ${path}`);
    return firebase_tools.firestore.delete(path, {
      project: process.env.GCLOUD_PROJECT,
      recursive: true,
      yes: true,
      token: functions.config().fb.token
    }).then(() => { return { path: path }; });
  });