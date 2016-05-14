// Set up basic server.
var express = require('express');
var http = require('http');
var app = express();
var server = http.createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function() {
  console.log('Server listening at port %d', port);
});

// Routing ------------------------------------------------------------------*/

app.use(express.static(__dirname + '/public'));

// Chatroom Variables -------------------------------------------------------*/

var numUsers = 0;
var usersInChat = [];

// Socket events ------------------------------------------------------------*/

io.on('connection', function(socket) {
  var addedUser = false;

// Chatroom socket events ---------------------------------------------------*/

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function(data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data,
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function(username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    usersInChat.push(username);
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers,
      username: socket.username,
      users: usersInChat
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers,
      users: usersInChat
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function() {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function() {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects
  socket.on('disconnect', function() {
    if (addedUser) {
      --numUsers;
      for (var i = 0; i < usersInChat.length; i++) {
        if (socket.username === usersInChat[i]) {
          usersInChat.splice(i, 1);
        }
      }

      //echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers,
        users: usersInChat
      });
    }
  });

// YT socket events ---------------------------------------------------------*/

  // when the client emits 'player playing', we broadcast it to others.
  socket.on('player playing', function(data) {
    socket.broadcast.emit('video playing', {
      username: data,
      message: ' has played the video.'
    });
  });

  // when the client emits 'player paused', we broadcast it to others.
  socket.on('player paused', function(data) {
    socket.broadcast.emit('player paused', {
      username: data.username,
      message: ' has paused the video.',
      currentTime: data.currentTime
    });
  });

  // when the client emits 'player buffering', we broadcast it to others so that thier vids can wait.
  socket.on('player buffering', function(data) {
    socket.broadcast.emit('player buffering', {
      username: data,
      message: ' is buffering, hold on..'
    });
  });

  // when the yt client emits 'next video', broadcast it to others to update the queue list.
  socket.on('next video', function(data) {
    socket.broadcast.emit('next video', {
      videoId: data
    });
  });

});
