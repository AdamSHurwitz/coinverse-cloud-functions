const admin = require('firebase-admin');
const functions = require('firebase-functions');
const path = require('path');
const os = require('os');
const {Storage} = require('@google-cloud/storage');
const projectId = 'coinverse-media-staging';
const storage = new Storage({
  projectId: projectId,
});

const fs = require('fs');
const textToSpeech = require('@google-cloud/text-to-speech');

const client = new textToSpeech.TextToSpeechClient();

admin.initializeApp();

/*var gcs = gcloud.storage({
    projectId: 'coinverse-media-staging',
    keyFilename: '../firebase-admin-staging.json'
});*/

const text = 'Hello, world!';
//TODO: Use SSML conversion.
const request = {
    input: {text: text},
    // Select the language and SSML Voice Gender (optional)
    voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
    // Select the type of audio encoding
    audioConfig: {audioEncoding: 'MP3'},
}; 

//TODO: Version for Staging vs. Production.
// Retrieve the audiocast Cloud Storage path.
exports.getAudiocast = functions.https.onCall((data, context) => {

    //TODO: Check if audiocast file exists from Cloud Storage.
    var bucket = storage.bucket('gs://coinverse-media-staging.appspot.com/content/feeds/en-audio/');
    
    //TODO: If exists, return file path.
    //FIXME: bucket.exists
    console.log("Search for:" + data.id + " Exists in Storage:" + bucket.exists)

    //TODO: If doesn't exist, create audiocast, save to Cloud Storage, and return path
    client.synthesizeSpeech(request, (err, response) => {
        if (err) {
          console.error('ERROR:', err);
          return;
        }

        const fileName = (data.id + '.mp3');

        const tempFile = path.join(os.tmpdir(), fileName);

        var mp3File = fs.writeFile(tempFile, response.auioContent, 'binary', err => {
          if (err) {
            console.error('ERROR:', err);
            return;
          }
          console.log('Audio content written to file: ' + data.id + '.mpeg');
        });
        
        var filePathToUpload = path.join(os.tmpdir(), fileName)

        bucket.upload(filePathToUpload), function(err, file) {
          if (!err) {
            console.log('Audiocast uploaded!');
          } else {
            console.error('Audiocast upload error: ' + err.message);
          }
        };
      
    });

    return {
        filePath: "cloudStorage/someFilePath",
    };
});