const path = require('path');
const Database = require('better-sqlite3');

// Sqlite database connection and establish table
const db = new Database(path.join(__dirname, 'wifichat.db'));
db.prepare("CREATE TABLE IF NOT EXISTS wc (room TEXT, user TEXT, message TEXT, time DATETIME DEFAULT CURRENT_TIMESTAMP)").run();

// Insert method. Use .run(room, user, message)
const insert = db.prepare("INSERT INTO wc(room, user, message) VALUES(?,?,?)");

// Retrieve method. Use .all(room) to retrieve all messages from that room
const retrieve = db.prepare("SELECT * FROM (SELECT * FROM wc WHERE room = ? ORDER BY time DESC limit 200) ORDER BY time ASC");

module.exports = {insert, retrieve};