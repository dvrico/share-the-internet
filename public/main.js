$(function() {


  // Initialize variables
  var $window = $(window);
  var $usernameInput = $('.usernameInput');
  var $messages = $('.messages');
  var $inputMessage = $('.inputMessage');

  var $loginPage = $('.login.page');
  var $chatPage = $('.chat.page');

  // Prompt for setting a username
  var username;
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

  // Log a message
  function log(message, options) {
    var $el = $('<li>').addClass('log').text(message);
  }

  // Prevent input from having injected markup
  function cleanInput(input) {
    return $('<div/>').text(input).text();
  }


  // Keyboard events
  $window.keydown(function(event) {

    // When the client hits ENTER on thier keyboard
    if(event.which === 13) {
      setUsername();
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
  });
  addParticipantsMessage(data);

});
