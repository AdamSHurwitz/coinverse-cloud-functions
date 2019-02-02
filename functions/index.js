const admin = require('firebase-admin');
const functions = require('firebase-functions');
const getAudiocast = require('./audiocast');
const deleteUser = require('./user');
admin.initializeApp(); 

exports.getAudiocast = functions.https.onRequest((req, res) => {
  getAudiocast.handler(req, res);
});
exports.deleteUser = functions.https.onRequest((req, res) => {
  deleteUser.handler(req, res);
});