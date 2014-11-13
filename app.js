var express = require('express'),
  bodyParser = require('body-parser'),
  mongoose = require('mongoose'),
  session = require('express-session'),
  MongoStore = require('connect-mongo')(session),
  app = express();

// 以下のディレクトリを手動で作成
// Windows: c:\data\db ディレクトリを事前に作成
// Mac OS / Linux: /data/db ディレクトリを事前に作成
// Windowsは C:\Program Files\MongoDB 2.6 Standard\bin にパスを通す
// 次のコマンドでMongoDBを起動 mongod --port 27017
var mongodbUrl = 'mongodb://localhost:27017/chat';
mongoose.connect(mongodbUrl);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected correctly to server");
  var Schema = mongoose.Schema;
  var roomSchema = new Schema({
    name: String,
    msgs: [{
      name: String,
      text: String
    }]
  });
  var Room = mongoose.model('Room', roomSchema)

  // res.render で省略するデフォルトの拡張子を設定
  app.set('view engine', 'ejs');

  // POSTデータをパースするミドルウェアを設定
  app.use(bodyParser.json({
    extended: true
  }));
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  // セッションを利用するための設定
  app.use(session({
    secret: 'please_change_this_secret',
    store: new MongoStore({
      db: 'chat',
    })
  }));

  app.get('/', function(req, res) {
    Room.find(function(err, rooms) {
      if (!req.session.name) {
        req.session.name = "anonymous";
      }
      res.render('index', {
        name: req.session.name,
        rooms: rooms
      });
    });
  });

  app.post('/name', function(req, res) {
    req.session.name = req.body.name;
    res.redirect('/');
  });

  app.post('/rooms', function(req, res) {
    var room = new Room({
      name: req.body.roomName,
      msgs: []
    });
    room.save(function(err, room) {
      res.redirect('/');
    });
  });

  app.get('/rooms/:id', function(req, res) {
    Room.findOne({
      _id: req.params.id
    }, function(err, room) {
      if (!req.session.name) {
        req.session.name = "anonymous";
      }
      res.render('room', {
        name: req.session.name,
        room: room
      });
    });
  });

  app.post('/rooms/:id', function(req, res) {
    Room.findOne({
      _id: req.params.id
    }, function(err, room) {
      room.msgs.push({
        name: req.body.name,
        text: req.body.message
      });
      room.save(function(err, room) {
        res.redirect('/rooms/' + req.params.id);
      });
    });
  });

  var server = app.listen(3000, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Server running at http://%s:%s', host, port);
  });

});
