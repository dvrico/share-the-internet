
var socket = io();

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
    videoId: 'Q2foQwkKQgc',
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

// The API calls this function when the player's state changes. The function
// indicates that the user plays a video, the server should receive the update.
// Same with user pausing a video.
var done = false;
function onPlayerStateChange(event) {
  console.log(event.data);
  if (event.data == YT.PlayerState.PLAYING && !done) {
    // emit to server that video has started playing
    socket.emit('player playing');
  }
  if (event.data == YT.PlayerState.PAUSED && !done) {
    // emit to server that video has been paused
    socket.emit('player paused');
  }
  if (event.data == YT.PlayerState.BUFFERING && !done) {
    //emit to server that video is buffering
    socket.emit('player buffering');
  }
}

// socket listens for server notify them if video is playing or paused
socket.on('player playing', function() {
  playVideo();
})

socket.on('player paused', function() {
  pauseVideo();
})

socket.on('player buffering', function(data) {
  pauseVideo();
})

function playVideo() {
  console.log('video played by other user');
  player.playVideo();
}

function pauseVideo() {
  console.log('video paused by other user');
  player.pauseVideo();
}
