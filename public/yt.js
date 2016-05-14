
// Variables ----------------------------------------------------------------*/

var socket = io();
var $inputVid = $('.inputVid');

var videoQueue = [];

// Set up for YT API --------------------------------------------------------*/

// Loads the iframe player API code async-ly
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Creates an <iframe> (and YT player) after the API code dl
var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: 'lUzpPwzA2QQ',
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

// The API will call this function when the video player is ready.
function onPlayerReady(event) {
  event.target.stopVideo();
}

// YT State Change Listener -------------------------------------------------*/

// The API calls this function when the player's state changes. The function
// indicates that the user plays a video, the server should receive the update.
// Same with user pausing a video and video buffering.
var done = false;
function onPlayerStateChange(event) {
  var userName = window.localStorage.getItem("userName");
  if (event.data == YT.PlayerState.PLAYING && !done) {
    // emit to server that video has started playing
    socket.emit('player playing', userName);
  }
  if (event.data == YT.PlayerState.PAUSED && !done) {
    // emit to server that video has been paused and send over current time of video
    socket.emit('player paused', {
      username: userName,
      currentTime: player.getCurrentTime()
    });
    //test for video time matching
    console.log(player.getCurrentTime());
  }
  if (event.data == YT.PlayerState.BUFFERING && !done) {
    //emit to server that video is buffering
    socket.emit('player buffering', userName);
  }
  if (event.data == YT.PlayerState.ENDED) {
    //done = true;
    if (videoQueue.length >= 1) {
      var nextVideo = videoQueue.shift();
      player.loadVideoById(nextVideo);
      socket.emit('next video', nextVideo);
    }
  }
}

// Functions ----------------------------------------------------------------*/

function playVideo() {
  console.log('playing now');
  player.playVideo();
}

function pauseVideo() {
  player.pauseVideo();
}

function checkVidInput(string) {
  var isYouTubeString = string.startsWith('https://www.youtube.com/')
  if (isYouTubeString) {
    return true;
  } else {
    return false;
  }
}

function addToQueue(string) {
  videoQueue.push(string);
  console.log(videoQueue);
}

function parse(url) {
  var start = url.indexOf('=');
  start++; // Start slice after equals sign instead of on equals sign
  return url.slice(start);
}

// Socket events ------------------------------------------------------------*/

// socket listens for server notify them if video is playing or paused
socket.on('video playing', function() {
  console.log('received server request to play video');
  playVideo()
})

socket.on('player paused', function(data) {
  var playerTime = player.getCurrentTime()
  pauseVideo();
  if (playerTime !== data.currentTime) {
    player.seekTo(data.currentTime, true);
    console.log(data.currentTime);
    console.log("syncing to other users.");
  }
})

socket.on('player buffering', function(data) {
  pauseVideo();
})

// Keyboard events ----------------------------------------------------------*/

// Listen for a youtube url on input field
$inputVid.keydown(function(event) {
  if (event.which === 13) {
    if (checkVidInput($inputVid.val()) ) {
      var YTstring = parse($inputVid.val());
      console.log(YTstring);
      addToQueue(YTstring);
    }
  }
})
