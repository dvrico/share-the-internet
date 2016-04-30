$(function() {
  var FADE_TIME = 150; // in ms
  var TYPING_TIMER_LENGTH = 400; // in ms

  // Initialize variables
  var $window = $(window);
  var $usernameInput = $('.usernameInput');
  var $userLog = $('.users');
  var $messages = $('.messages');
  var $inputMessage = $('.inputMessage');

  var $loginPage = $('.login.page');
  var $chatPage = $('.chat.page');
  var $sharingPage = $('.shareBlock');
  var $videoFrame = $('.iframe *');

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
    for(var i = 0; i < data.users.length; i++) {
      message += ' ' + data.users[i];
    }

    var options = {
      userLogInfo: true
    }
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
    var $messageDiv = $('<li class="message"/>')
      .data('username', data.username)
      .addClass(typingClass)
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

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.userLogInfo) {
      $userLog.append($el);
    }
    if (options.message) {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
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

  // Gets the 'X is typing' messages of a user
  function getTypingMessages(data) {
    return $('.typing.message').filter(function(i) {
      return $(this).data('username') === data.username;
    });
  }

  // Keyboard events
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

  // Click events

  // Focus input when clicking anywhere on login page
  $loginPage.click(function() {
    $currentInput.focus()
  })

  // Focus input when clicking on the message input's border
  $inputMessage.click(function() {
    $inputMessage.focus();
  });

  // Emit click event when video is clicked
  $videoFrame.click(function() {
    console.log('you clicked');
    socket.emit('video click');
  })

  // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on('login', function(data) {
    connected = true;
    // Display the welcome message
    var message = "Welcome to Sharing the Internet! Participants:";
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

  // Whenever the server emits 'video click', simulate a click on the iframe.
  socket.on('video click', function() {
    console.log('someone clicked')
    $videoFrame.click();
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
