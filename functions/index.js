const Speech = require('ssml-builder');
const textToSpeech = require('@google-cloud/text-to-speech');
const path = require('path');
const os = require('os');
const fs = require('fs');
const util = require('util');
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const {Storage} = require('@google-cloud/storage');

const charLimitError = "Error: 3 INVALID_ARGUMENT: 5000 characters limit exceeded."

admin.initializeApp(); 

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

  var textFileName = data.id + '.txt';
  var textFilePath = "content/feeds/en/text/" + textFileName;
  var audioFileName = data.id + '.mp3';
  var audioFilePath = "content/feeds/en/audio/" + audioFileName;
  var tempTextFile;
  var tempAudioFile;
  var errorMessage;

  return bucket.file(audioFilePath).exists()
  .catch(err => {
    console.error("Check if file exists error: " + err);
  })
  .then(currentData => {
    var exists = currentData[0];
    console.log("Article " + data.id + " exists: " + exists)
    if (exists) {
      return { 
        filePath: audioFilePath, 
        error: errorMessage 
       }
    } else {
      tempTextFile = path.join(os.tmpdir(), textFileName); 
      return bucket.file(textFilePath).download({
        destination: tempTextFile,
      });
    }
  })
  .catch(err => {
    console.error("Download text file error: " + err);
  })
  .then(() => {
    console.log('Text downloaded to', tempTextFile);
    const readFile = util.promisify(fs.readFile);
    return readFile(tempTextFile, 'utf8');
  })
  .catch(err => {
    console.error("Read " + tempTextFile + ": " + err);
  })
  .then((readData) => {
    console.log('Convert Article ' + data.id + ': ' + readData);
    //TODO: Improve SSML.
    return new textToSpeech.TextToSpeechClient().synthesizeSpeech({
      input: { ssml: (new Speech).say(readData).ssml()},
      voice: {
        languageCode: 'en-GB',
        name: 'en-GB-Wavenet-C',
      },
      audioConfig: {
        audioEncoding: 'MP3',
        pitch: "0.00",
        speakingRate: "1.00"
      },
    });
  })
  .catch(err => {
    if (err.toString() === charLimitError) {
      errorMessage = "TTS_CHAR_LIMIT_ERROR";
    }
    console.error("Synthesize Speech: " + err.toString());
  })
  .then(responses => { 
    tempAudioFile = path.join(os.tmpdir(), audioFileName);      
    const writeFile = util.promisify(fs.writeFile);
    return writeFile(tempAudioFile, responses[0].audioContent, 'binary')
  })
  .catch(err => {
    console.error("Write Temporary Audio File Error: " + err);
  })
  .then(() => {
    return bucket.upload(tempAudioFile, { destination: audioFilePath })
  })
  .catch(err => {
    console.error('Upload Audio to GCS Error: ' + err);
  })
  .then(() => {
    return { 
      filePath: audioFilePath, 
      error: errorMessage 
    }
  })
});