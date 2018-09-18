const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

const MAIN_FEED_TYPE = "MAIN";
const SAVED_FEED_TYPE = "SAVED";
const ARCHIVED_FEED_TYPE = "ARCHIVED";
const SAVE_USER_ACTION = "SAVE";
const ARCHIVE_USER_ACTION = "ARCHIVE";
const SAVED_PATH = "saved"
const ARCHIVED_PATH = "archived"

exports.updateQualityScore = functions.https.onCall((data, context) => {
    const environment = data.environment
    const feedType = data.feedType
    const action = data.action
    const contentTitle = data.contentTitle
    const uid = context.auth.uid;

    var feedTypePath
    if (feedType === SAVED_FEED_TYPE) {
        feedTypePath = SAVED_PATH
    } else if (feedType === ARCHIVED_FEED_TYPE) {
        feedTypePath = ARCHIVED_PATH
    }

    admin.firestore().collection('qa/content/feeds/main/content/').doc(contentTitle)
        .get().then(function(doc) {
            console.log('Trigger fired on content: ' 
                +  contentTitle +  " | user: " + uid
                + " | action: " + action + ' | feedType: ' + feedType);
            if (doc.exists) {
                console.log("Document data:", doc.data());
            } else {
                console.log("No such document!");
            }
            return {
                status: 'Get content success.'
             }
        }).catch(function(error) {
            console.log("Error getting document:", error);
            return {
                status: 'Get content error.'
            }
        });
});