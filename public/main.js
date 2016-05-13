$(function() {
var FADE_TIME = 150; // in ms
var TYPING_TIMER_LENGTH = 400; // in ms

// Initialize variables
var $window = $(window);
var $usernameInput = $('.usernameInput');
var $userLog = $('.users');
var $messages = $('.messages');
var $shares = $('.shares');
var $inputMessage = $('.inputMessage');
var $inputVid = $('.inputVid');

var $loginPage = $('.login.page');
var $chatPage = $('.chat.page');
var $sharingPage = $('.shareBlock');

// Prompt for setting a username
var username;
var usersInChat = []
var connected = false;
var typing = false;
var lastTypingTime;
var $currentInput = $usernameInput.focus();

var socket = io();

function addParticipantsMessage(data) {
  var message = ''
  // Add all users in chat to message string
  for(var i = 0; i < data.users.length; i++) {
    message += ' ' + data.users[i];
  }

  var options = {
    userLogInfo: true
  }
  // update previous message string by removing it!
  if($('ul.users li:nth-child(2)')) {
    $('ul.users li:nth-child(2)').remove();
  }
  log(message, options);

}

// Sets the client's username
function setUsername() {
  username = cleanInput($usernameInput.val().trim());

  // If username is valid
  if(username) {
    $loginPage.fadeOut();
    $chatPage.show();
    $sharingPage.show();
    $loginPage.off('click');
    $currentInput = $inputMessage.focus();

    // Tell the server your username
    socket.emit('add user', username);
  }
}

// Sends a chat message
function sendMessage() {
  var message = $inputMessage.val()
  // Prevent injected markup
  message = cleanInput(message)
  // if there is a non-empty message and a socket connection
  if (message && connected) {
    $inputMessage.val('');
    addChatMessage({
      username: username,
      message: message
    }, {
      message: true
    });
    // tell the server to execute 'new message' and send along one parameter
    socket.emit('new message', message);
  };
};

// Log a message
function log(message, options) {
  var $el = $('<li>').addClass('log').text(message);
  addMessageElement($el, options);
}

// Adds the visual chat message to the message list
function addChatMessage(data, options) {
  // Don't fade the message in if there is an 'X was typing'
  var $typingMessages = getTypingMessages(data);
  options = options || {};
  if ($typingMessages.length !== 0) {
    options.fade = false;
    $typingMessages.remove();
  }

  var $usernameDiv = $('<span class="username"/>')
    .text(data.username)
    .css('color', '#F00')
  var $messageBodyDiv = $('<span class="messageBody">')
    .text(data.message);

  var typingClass = data.typing ? 'typing' : '';
  var vidInput = options.vidInput ? 'vidInput' : '';
  var $messageDiv = $('<li class="message"/>')
    .data('username', data.username)
    .addClass(typingClass)
    .addClass(vidInput)
    .append($usernameDiv, $messageBodyDiv);

  addMessageElement($messageDiv, options);
}

function addChatTyping(data) {
  data.typing = true;
  data.message = 'is typing';
  addChatMessage(data, {message: true});
}

function removeChatTyping(data) {
  getTypingMessages(data).fadeOut(function() {
    $(this).remove();
  });
}

// Adds a message element to the messages and scrolls to the bottom
// el - The element to add as a message
// options.fade - If the element should fade-in (default = true)
// options.prepend - If the element should prepend
// all other messages (default = false)
function addMessageElement(el, options) {
  var $el = $(el);

  // Setup default options
  if (!options) {
    options = {};
  }
  if (typeof options.fade === 'undefined') {
    options.fade = true;
  }
  if (typeof options.userLogInfo === 'undefined') {
    options.userLogInfo = false;
  }
  if (typeof options.message === 'undefined') {
    options.message = false;
  }
  if (typeof options.serverMessage === 'undefined') {
    options.serverMessage = false;
  }
  if (typeof options.queueList === 'undefined') {
    options.queueList = false;
  }

  // Apply options
  if (options.fade) {
    $el.hide().fadeIn(FADE_TIME);
  }
  if (options.userLogInfo) {
    $userLog.append($el);
  }
  if (options.serverMessage) {
    $el.css('color', '#0acc1a');
  }
  if (options.message) {
    $messages.append($el);
  }
  if (options.queueList) {
    $shares.append($el);
  }
  $messages[0].scrollTop = $messages[0].scrollHeight;
  //$shares[0].scrollTop = $messages[0].scrollHeight;
}

// Prevent input from having injected markup
function cleanInput(input) {
  return $('<div/>').text(input).text();
}

function updateTyping() {
  if (connected) {
    if (!typing) {
      typing = true;
      socket.emit('typing');
    }
    lastTypingTime = (new Date()).getTime();

    setTimeout(function() {
      var typingTimer = (new Date()).getTime();
      var timeDiff = typingTimer - lastTypingTime;
      if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
        socket.emit('stop typing');
        typing = false;
      }
    }, TYPING_TIMER_LENGTH);
  }
}

function checkVidInput(string) {
  var isYouTubeString = string.startsWith('https://www.youtube.com/')
  if (isYouTubeString) {
    return true;
  } else {
    return false;
  }
}

function resetInputBox() {
  $inputVid.val('Error! Not a vaild YouTube url.')
  .css('color', 'red')
  .css('font-weight', 'bold');
  setTimeout(function() {
    $inputVid.val('')
    .css('color', '#000')
    .css('font-weight', '300');
  }, 1500);
}

// Gets the 'X is typing' messages of a user
function getTypingMessages(data) {
  return $('.typing.message').filter(function(i) {
    return $(this).data('username') === data.username;
  });
}

// Stores the user's username locally
function storeUser(name) {
  var userName = name;
  window.localStorage.setItem("userName", userName);
}

// Keyboard events ----------------------------------------------------------*/
$window.keydown(function(event) {

  // When the client hits ENTER on thier keyboard
  if (event.which === 13) {
    if (username) {
      sendMessage();
      socket.emit('stop typing');
      typing = false;
    } else {
      setUsername();
    }
  }
})

$inputMessage.on('input', function() {
  updateTyping();
})

$inputVid.keydown(function(event) {
  if (event.which === 13) {
    if (username) {
      if (checkVidInput($inputVid.val()) ) {
        addChatMessage({
          username: username,
          message: $inputVid.val()
        }, {
          vidInput: true,
          queueList: true
        });
        $inputVid.val('');
      } else {
        resetInputBox();
      }
    }
  }
})

// Click events -------------------------------------------------------------*/

// Focus input when clicking anywhere on login page
$loginPage.click(function() {
  $currentInput.focus()
})

// Focus input when clicking on the message input's border
$inputMessage.click(function() {
  $inputMessage.focus();
});

//Focus input when clicking on the inputVid's border
$inputVid.click(function() {
  $inputVid.focus();
});

// Socket events ------------------------------------------------------------*/

// Whenever the server emits 'login', log the login message
socket.on('login', function(data) {
  connected = true;
  // Display the welcome message
  var message = "Welcome to Sharing the Internet! Participants:";
  // Store the username locally for yt.js
  storeUser(data.username);

  log(message, {
    prepend: true,
    userLogInfo: true
  });
  addParticipantsMessage(data);
});

// Whenever the server emits 'new message', update the chat body
socket.on('new message', function(data) {
  addChatMessage(data, {message: true});
});

// Whenever the server emits 'typing', show the typing message
socket.on('typing', function(data) {
  addChatTyping(data);
});

// Whenever the server emits 'stop typing', kill the typing message
socket.on('stop typing', function(data) {
  removeChatTyping(data);
});

// Whenever the server emits 'player playing', log it into chat.
// Do this for 'player paused' and 'player buffering' as well.
socket.on('video playing', function(data) {
  addChatMessage(data, {
    message: true,
    serverMessage: true
  });
});

socket.on('player paused', function(data) {
  addChatMessage(data, {
    message: true,
    serverMessage: true
  });
});

socket.on('player buffering', function(data) {
  addChatMessage(data, {
    message: true,
    serverMessage: true
  });
});

// Whenever the server emits 'user joined', log it in the chat body
socket.on('user joined', function(data){
  log(data.username + ' joined');
  addParticipantsMessage(data);
});

//Whenever the server emits 'user left', log it in the chat body
socket.on('user left', function(data){
  log(data.username + ' left');
  addParticipantsMessage(data);
  removeChatTyping(data);
});


});
