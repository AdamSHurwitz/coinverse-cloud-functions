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

//TODO: Version for Staging vs. Production.
// Retrieve the audiocast Cloud Storage path.
exports.getAudiocast = functions.https.onCall((data, context) => {
  const bucket = storage.bucket('gs://coinverse-media-staging.appspot.com');
  var fileName;
  var tempFile;
  var filePath;

  //TODO: Check if file exists, return file path or create new file.

  //TODO: Pass in content text.
  //TODO: Use SSML configuration. 
  return client.synthesizeSpeech({
    input: {text: 'Hello, world!'},    
    voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},    
    audioConfig: {audioEncoding: 'MP3'},
  })
  .then(responses => {
    var response = responses[0]; 
    console.log("Synthesize Speech: " + response.audioContent)   
    fileName = data.id + '.mp3'
    tempFile = path.join(os.tmpdir(), fileName);       
    return fs.writeFile(tempFile, response.auioContent, 'binary')      
  })
  .catch(err => {
    console.error("Synthesize Speech Error: " + err);
  })
  .then(() => {
     console.log('Write Temporary Audio File: ' + tempFile);
     filePath = "content/feeds/en-audio/" + fileName;
     return bucket.upload(tempFile, { destination: (filePath) })
   })
   .catch(err => {
     console.error("Write Temporary Audio File Error: " + err);
   })
   .then(() => {
     console.log('Upload Audio to GCS: ' + filePath);
     return { filePath: filePath }
     })
   .catch(err => {
      console.error('Upload Audio to GCS ERROR: ' + err);
    });
});