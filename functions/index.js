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
    var bucket = storage.bucket('gs://coinverse-media-staging.appspot.com');

    //TODO: Check if file exists, return file path or create new file.
    return client.synthesizeSpeech(request, (err, response) => {
        if (!err) { 
          var fileName = data.id + '.mp3'
          const tempFile = path.join(os.tmpdir(), fileName);
          return fs.writeFile(tempFile, response.auioContent, 'binary', err => {
            if (!err) {
              console.log('Audio content written to file: ' + tempFile);
              var filePath = "content/feeds/en-audio/" + fileName;
              return bucket.upload(tempFile, { destination: (filePath) }, (err, file) => {
                if (!err) {
                  console.log('Audiocast uploaded!');
                  return {
                    filePath: filePath,
                  };
                } else {
                  console.error('Audiocast upload error: ' + err.message);
                  return {
                    filePath: "AUDIO_UPLOAD_ERROR",
                  };
                }
              });
            } else {
              console.error('Write file error:', err);
              return {
                filePath: "AUDIO_WRITE_FILE_ERROR",
              };
            }
          }); 
        } else {
          console.error('ERROR:', err);
          return {
            filePath: "AUDIO_SYNTHESIZE_ERROR",
          };
        } 
    });
});