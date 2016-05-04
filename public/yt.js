
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

// The API calls this function when the player's state changes. The function
// indicates that the user plays a video, the server should receive the update.
// Same with user pausing a video and video buffering.
var done = false;
function onPlayerStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING && !done) {
    // emit to server that video has started playing
    socket.emit('player playing');
    console.log('emitting player playing from YTapi');
  }
  if (event.data == YT.PlayerState.PAUSED && !done) {
    // emit to server that video has been paused and send over current time of video
    //var playerTime = player.getCurrentTime();
    socket.emit('player paused', {
      currentTime: player.getCurrentTime()
    });
    console.log(player.getCurrentTime());
  }
  if (event.data == YT.PlayerState.BUFFERING && !done) {
    //emit to server that video is buffering
    socket.emit('player buffering');
  }
}

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

function playVideo() {
  console.log('playing now');
  player.playVideo();
}

function pauseVideo() {
  player.pauseVideo();
}
