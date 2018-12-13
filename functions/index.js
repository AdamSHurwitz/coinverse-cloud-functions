const path = require('path');
const os = require('os');
const fs = require('fs');
const util = require('util');
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const {Storage} = require('@google-cloud/storage');
const textToSpeech = require('@google-cloud/text-to-speech');

const client = new textToSpeech.TextToSpeechClient();
const charLimitError = "Error: 3 INVALID_ARGUMENT: 5000 characters limit exceeded."

admin.initializeApp();

//TODO: Use SSML configuration. 

// Converts and saves article text into audio.
exports.getAudiocast = functions.https.onCall((data, context) => {
  var storage;
  var bucket;
  if (data.debugEnabled === true) {
    storage = new Storage({ projectId: 'coinverse-media-staging' });
    bucket = storage.bucket('gs://coinverse-media-staging.appspot.com');
  } else {
    storage = new Storage({ projectId: 'carpecoin-media-211903' });
    bucket = storage.bucket('gs://carpecoin-media-211903.appspot.com');    
  }
  
  var fileName = data.id + '.mp3';
  var filePath = "content/feeds/en-audio/" + fileName;
  var tempFile;
  var errorMessage;

  return bucket.file(filePath).exists()
  .then(currentData => {
    var exists = currentData[0];
    console.log("Article " + data.id + " exists: " + exists)
    if (exists) {
      return { 
        filePath: filePath, 
        error: errorMessage 
       }
    } else {
      console.log('Convert Article ' + data.id + ': ' + data.text)
      return client.synthesizeSpeech({
        input: { text: data.text },
        voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
        audioConfig: {audioEncoding: 'MP3'},
      })
    }
  }).catch(err => {
    console.error("Check if file exists error: " + err);
  })
  .then(responses => { 
    tempFile = path.join(os.tmpdir(), fileName);      
    const writeFile = util.promisify(fs.writeFile);
    return writeFile(tempFile, responses[0].audioContent, 'binary')
  })
  .catch(err => {
    if (err.toString() === charLimitError) {
      errorMessage = "TTS_CHAR_LIMIT_ERROR";
      console.error("Synthesize Speech: " + err);
    }
  })
  .then(() => {
    return bucket.upload(tempFile, { destination: filePath })
  })
  .catch(err => {
    console.error("Write Temporary Audio File Error: " + err);
  })
  .then(() => {
    return { 
      filePath: filePath, 
      error: errorMessage 
    }
  })
  .catch(err => {
    console.error('Upload Audio to GCS Error: ' + err);
  });
});