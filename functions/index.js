const path = require('path');
const os = require('os');
const fs = require('fs');
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const {Storage} = require('@google-cloud/storage');
const textToSpeech = require('@google-cloud/text-to-speech');

const storage = new Storage({
  projectId: 'coinverse-media-staging',
});
const client = new textToSpeech.TextToSpeechClient();

admin.initializeApp();

//TODO: Use SSML configuration.
const request = {
    input: {text: 'Hello, world!'},    
    voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},    
    audioConfig: {audioEncoding: 'MP3'},
}; 

//TODO: Version for Staging vs. Production.
// Retrieve the audiocast Cloud Storage path.
exports.getAudiocast = functions.https.onCall((data, context) => {

    //TODO: Check if audiocast file exists from Cloud Storage.
    var bucket = storage.bucket('gs://coinverse-media-staging.appspot.com');
    
    //TODO: If exists, return file path.
    //FIXME: bucket.exists
    console.log("Search for:" + data.id + " Exists in Storage:" + bucket.exists)

    //TODO: If doesn't exist, create audiocast, save to Cloud Storage, and return path
    client.synthesizeSpeech(request, (err, response) => {
        if (err) {
          console.error('ERROR:', err);
          return;
        }
        var fileName = data.id + '.mp3'
        const tempFile = path.join(os.tmpdir(), fileName);
        fs.writeFile(tempFile, response.auioContent, 'binary', err => {
          if (err) {
            console.error('ERROR:', err);
            return;
          }
          console.log('Audio content written to file: ' + tempFile);

          bucket.upload(tempFile, { destination: ("content/feeds/en-audio/" + fileName) }, (err, file) => {
            if (!err) {
              console.log('Audiocast uploaded!');
            } else {
              console.error('Audiocast upload error: ' + err.message);
            }
          });
        });  
    });

    //TODO: Pass back real path.
    return {
        filePath: "cloudStorage/someFilePath",
    };
});