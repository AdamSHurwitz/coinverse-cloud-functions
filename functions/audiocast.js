const functions = require('firebase-functions');
const {Storage} = require('@google-cloud/storage');
const os = require('os');
const textToSpeech = require('@google-cloud/text-to-speech');
const Speech = require('ssml-builder');
const path = require('path');
const fs = require('fs');
const util = require('util');
const charLimitError = "Error: 3 INVALID_ARGUMENT: 5000 characters limit exceeded."
const promise = (promise) => promise
  .then(data => [null, data])
  .catch(error => [error, null]);

// Converts and saves article text into audiocast.
exports.getAudiocast = () => functions.https.onCall(async (data, context) => {
    var storage;
    var bucket;
    if (data.debugEnabled === true) {
      storage = new Storage({ projectId: 'coinverse-media-staging' });
      bucket = storage.bucket('gs://coinverse-media-staging.appspot.com');
    } else {
      storage = new Storage({ projectId: 'carpecoin-media-211903' });
      bucket = storage.bucket('gs://carpecoin-media-211903.appspot.com');    
    }
  
    var exists;
    var textFileName = data.id + '.txt';
    var textFilePath = "content/feeds/en/text/" + textFileName;
    var audioFileName = data.id + '.mp3';
    var audioFilePath = "content/feeds/en/audio/" + audioFileName;
    var tempTextFile;
    var tempAudioFile;
    var errorMessage;
    
    // Check if audiocast exists.
    const [fileExistsError, fileExists] = await promise(bucket.file(audioFilePath).exists())
    if (fileExistsError) {
      console.error("Check if file exists error: " + fileExistsError);
      return { error: fileExistsError }
    }
    exists = fileExists[0];
    console.log("Article " + data.id + " exists: " + exists)
    if (exists) return { filePath: audioFilePath }
    tempTextFile = path.join(os.tmpdir(), textFileName); 
  
    // Download content text.
    const [downloadTextFileError] = await promise(
      bucket.file(textFilePath).download({ destination: tempTextFile,})
    )
    if (downloadTextFileError) {
      console.error("Download text file error: " + downloadTextFileError);
      return { error: downloadTextFileError }
    }
      
    // Read content text.
    const readFile = util.promisify(fs.readFile);
    const [readTextFileError, textFileData] = await promise(readFile(tempTextFile, 'utf8'))
    if (readTextFileError) {
      console.error("Read text file error: " + readTextFileError);
      return { error: readTextFileError }
    }
  
    // Convert text to audiocast.
    const [textToSpeechError, textToSpeechResponse] = await promise(
      new textToSpeech.TextToSpeechClient().synthesizeSpeech({
        input: { ssml: (new Speech).say(textFileData).ssml()},
        voice: { languageCode: 'en-GB', name: 'en-GB-Wavenet-C',},
        audioConfig: { audioEncoding: 'MP3', pitch: "0.00", speakingRate: "1.00"},
      }))
      if (textToSpeechError) {
        if (textToSpeechError.toString() === charLimitError) {
          console.error("Synthesize Speech: " + textToSpeechError);
          return { error: "TTS_CHAR_LIMIT_ERROR" }
        }
      }
      
      // Write audiocast to mp3. 
      tempAudioFile = path.join(os.tmpdir(), audioFileName);      
      const writeFile = util.promisify(fs.writeFile);
      const [writeAudioFileError] = await promise(writeFile(tempAudioFile, textToSpeechResponse[0].audioContent, 'binary'))
      if (writeAudioFileError) {
        console.error("Write Temporary Audio File Error: " + writeAudioFileError);
        return { error: writeAudioFileError }
      }
  
      // Upload audiocast mp3 to Cloud Storage.
      const [uploadAudioFileError] = await promise(bucket.upload(tempAudioFile, { destination: audioFilePath }))
      if (uploadAudioFileError) {
        console.error('Upload Audio to GCS Error: ' + uploadAudioFileError);
        return { error: uploadAudioFileError }
      }
      return { filePath: audioFilePath, error: uploadAudioFileError }
  });