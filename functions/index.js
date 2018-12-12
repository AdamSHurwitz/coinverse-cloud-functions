const path = require('path');
const os = require('os');
const fs = require('fs');
const util = require('util');
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
//TODO: Check if file exists, return file path or create new file.
//TODO: Use SSML configuration. 

// Converts and saves article text into audio.
exports.getAudiocast = functions.https.onCall((data, context) => {
  const bucket = storage.bucket('gs://coinverse-media-staging.appspot.com');
  var fileName;
  var tempFile;
  var filePath;

  console.log('Convert Article ' + data.id + ': ' + data.text)
  return client.synthesizeSpeech({
    input: {text: data.text },
    // Select the language and SSML Voice Gender (optional)
    voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
    // Select the type of audio encoding
    audioConfig: {audioEncoding: 'MP3'},
  })
  .then(responses => { 
    fileName = data.id + '.mp3'
    tempFile = path.join(os.tmpdir(), fileName);      
    const writeFile = util.promisify(fs.writeFile);
    return writeFile(tempFile, responses[0].audioContent, 'binary')
  })
  .catch(err => {
    console.error("Synthesize Speech Error: " + err);
  })
  .then(() => {
     console.log('Write Temporary Audio File: ' + tempFile);
     filePath = "content/feeds/en-audio/" + fileName;
     return bucket.upload(tempFile, { destination: filePath })
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