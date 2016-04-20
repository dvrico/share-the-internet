$(function() {
  var FADE_TIME = 150; // in ms

  // Initialize variables
  var $window = $(window);
  var $usernameInput = $('.usernameInput');
  var $messages = $('.messages');
  var $inputMessage = $('.inputMessage');

  var $loginPage = $('.login.page');
  var $chatPage = $('.chat.page');

  // Prompt for setting a username
  var username;
  var connected = false;
  var $currentInput = $usernameInput.focus();

  var socket = io();

  function addParticipantsMessage(data) {
    var message = '';
    if (data.numUsers === 1) {
      message += "there's 1 participant";
    } else {
      message += "there are " + data.numUsers + " participants";
    }
    log(message);
  }

  // Sets the client's username
  function setUsername() {
    username = cleanInput($usernameInput.val().trim());

    // If username is valid
    if(username) {
      $loginPage.fadeOut();
      $chatPage.show();
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
    // reversed for 'user is typing'

    var $usernameDiv = $('<span class="username"/>')
      .text(data.username)
      .css('color', '#F00')
    var $messageBodyDiv = $('<span class="messageBody">')
      .text(data.message);

    var $messageDiv = $('<li class="message"/>')
      .data('username', data.username)
      .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);
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
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
  }

  // Prevent input from having injected markup
  function cleanInput(input) {
    console.log($('<div/>').text(input).text())
    return $('<div/>').text(input).text();
  }


  // Keyboard events
  $window.keydown(function(event) {

    // When the client hits ENTER on thier keyboard
    if (event.which === 13) {
      if (username) {
        sendMessage();
      } else {
        setUsername();
      }
    }
  })

  // Click events

  // Focus input when clicking anywhere on login page
  $loginPage.click(function() {
    $currentInput.focus()
  })


  // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on('login', function(data) {
    connected = true;
    // Display the welcome message
    var message = "Welcome to Sharing the Internet";
    log(message, {
      prepend: true
    });
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function(data) {
    addChatMessage(data);
  });



});
