const admin = require('firebase-admin');
const audiocast = require('./audiocast');
const user = require('./user');
admin.initializeApp(); 
exports.getAudiocast = audiocast.getAudiocast();
exports.deleteUser = user.deleteUser();