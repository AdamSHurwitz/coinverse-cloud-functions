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
    switch(data.buildTypeParam) {
      case 'debug': 
        storage = new Storage({ projectId: 'coinverse-media-staging' });
        bucket = storage.bucket('gs://coinverse-media-staging.appspot.com')
        console.log('getAudiocast - debug')
        break;  
      case 'release':
        storage = new Storage({ projectId: 'carpecoin-media-211903' });
        bucket = storage.bucket('gs://carpecoin-media-211903.appspot.com');   
        console.log('getAudiocast - release')
        break;
      case 'open':
        storage = new Storage({ projectId: 'coinverse-open' });
        bucket = storage.bucket('gs://coinverse-open.appspot.com');   
        console.log('getAudiocast - open')
        break;
      default: 
        storage = new Storage({ projectId: 'coinverse-media-staging' });
        bucket = storage.bucket('gs://coinverse-media-staging.appspot.com');  
        console.log('getAudiocast - default')
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
    console.log("Article: " + data.id + " exists: " + exists)
    if (exists) {
      console.log("Article: " + data.id + " return: " + audioFilePath)
      return { filePath: audioFilePath }
    }
    console.log("Article: " + data.id + " create: " + textFileName)
    tempTextFile = path.join(os.tmpdir(), textFileName); 
  
    // Download content text.
    const [downloadTextFileError] = await promise(
      bucket.file(textFilePath).download({ destination: tempTextFile,})
    )
    if (downloadTextFileError) {
      console.error("Download text file error: " + downloadTextFileError);
      return { error: downloadTextFileError }
    } 
    console.log("Download text: " + data.id + " download text: " + textFilePath)
      
    // Read content text.
    const readFile = util.promisify(fs.readFile);
    const [readTextFileError, textFileData] = await promise(readFile(tempTextFile, 'utf8'))
    if (readTextFileError) {
      console.error("Read text file error: " + readTextFileError);
      return { error: readTextFileError }
    }
    console.log("Read text file: " + data.id + " read text: success")
  
    // Convert text to audiocast.
    const [textToSpeechError, textToSpeechResponse] = await promise(
      new textToSpeech.TextToSpeechClient().synthesizeSpeech({
        // TODO - Re-implement once bug is fixed https://github.com/googleapis/nodejs-text-to-speech/issues/252
        //input: { ssml: (new Speech).say(textFileData).ssml()}  
        input: { text: textFileData},
        voice: { languageCode: 'en-GB', name: 'en-GB-Wavenet-C',},
        audioConfig: { audioEncoding: 'MP3', pitch: "0.00", speakingRate: "1.00"},
      }))
      if (textToSpeechError) {
        console.error("Synthesize Speech error: " + textToSpeechError + " response: " + textToSpeechResponse);
        if (textToSpeechError.toString() === charLimitError) return { error: "TTS_CHAR_LIMIT_ERROR" }
      }
      console.log("Synthesize Speech: " + textToSpeechResponse);
      
      // Write audiocast to mp3. 
      tempAudioFile = path.join(os.tmpdir(), audioFileName);      
      const writeFile = util.promisify(fs.writeFile);
      const [writeAudioFileError] = await promise(writeFile(tempAudioFile, textToSpeechResponse[0].audioContent, 'binary'))
      if (writeAudioFileError) {
        console.error("Write Temporary Audio File Error: " + writeAudioFileError);
        return { error: writeAudioFileError }
      }
      console.log("Write Temporary Audio File: " + audioFileName);
  
      // Upload audiocast mp3 to Cloud Storage.
      const [uploadAudioFileError] = await promise(bucket.upload(tempAudioFile, { destination: audioFilePath }))
      if (uploadAudioFileError) {
        console.error('Upload Audio to GCS Error: ' + uploadAudioFileError);
        return { error: uploadAudioFileError }
      }
      console.log("Upload Audio to GCS: " + audioFilePath);
      return { filePath: audioFilePath, error: uploadAudioFileError }
  });