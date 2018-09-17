const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

exports.categorizedContent = functions.firestore
    .document('qa/users/users/{userId}/{categoryType}/{contentTitle}')
    .onCreate((snap, context) => {

        console.log('Trigger fired!');
        
        // Get an object representing the document.
        // e.g. {'name': 'Marie', 'age': 66}
        const newValue = snap.data();
 
        // Access a particular field as you would any JS property.
        //const name = newValue.name;
 
        // perform desired operations ...
     });
 

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
