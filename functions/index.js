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

        return true;
    });