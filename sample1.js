var paywall = require("./lib/paywall");
setTimeout(() => paywall(13625054), 5000);

// location.reload(true);

require("component-responsive-frame/child");

var Flickity = require('flickity');

var soundFile = document.querySelector("#audio");
var unMuteButton = document.querySelector("#unmute");
var replayButton = document.querySelector("#replay");
var headline = document.querySelector(".headline");



var audioTimeStamp = 0;

var timeElapsed = 0;
var timeElapsed1 = 0;
var timeElapsed2 = 0;
var timeElapsed3 = 0;

var timeouts = [];
var timeouts1 = [];
var timeouts2 = [];
var timeouts3 = [];

var voicemails = {
  rombeek: {
    timeVar: timeElapsed1,
    clipLength: 27,
    array: timeouts1
  },
  damski: {
    timeVar: timeElapsed2,
    clipLength: 23.5,
    array: timeouts2
  },
  webber: {
    timeVar: timeElapsed3,
    clipLength: 33,
    array: timeouts3
  }
};



var elem = document.querySelector('.main-carousel');

document.querySelectorAll(".main-carousel").forEach(el => {

  new Flickity( el, {
    // options
    // cellAlign: 'left',
    contain: false,
    wrapAround: true,
    lazyLoad: true,
    autoPlay: false
  });

});



window.onload = function () {

  ////// HEADER VOICEMAIL ANIMATION ////////


  unMuteButton.addEventListener('click', () => {
    document.querySelectorAll(".command").forEach(el => {
      el.classList.toggle('hide');
    });

    if (document.querySelector(".mute").classList.contains('hide')) {
      soundFile.muted = true;
    } else {
      var timeElapsedNew = new Date().getTime();
      var timeElapsedOver = timeElapsedNew - timeElapsed;
      let sec = Math.round(timeElapsedOver / 1000);

      if (sec > 49){} else {
        soundFile.muted = false;
        soundFile.currentTime = sec;
        soundFile.play();
      }
    };
  });


  replayButton.addEventListener('click', () => {
    document.querySelectorAll(".person").forEach(el => {
        el.classList.remove('animate');
    });
    document.querySelectorAll(".allPersons .quote span").forEach(el => {
        el.style.opacity = "0.3";
    });
    document.querySelectorAll(".box").forEach(el => {
        el.classList.remove('fadeIn');
    });
    for (let i = 0; i < timeouts.length; i++) {
      clearTimeout(timeouts[i]);
    }
    soundFile.muted = document.querySelector(".mute").classList.contains('hide') ? true : false;
    soundFile.currentTime = 0;
    soundFile.play();
    runQuoteAnimation();
  });

  // Set off header animation //
  setTimeout(function(){
    runQuoteAnimation();
  }, 1100);



////// INTERSTITIAL VOICEMAILS ////////

document.querySelectorAll(".unmuteButton").forEach(el => el.addEventListener('click', () => {
    let parent = findAncestor(el, ".inter_voice");
    let objectKey = parent.dataset.name;
    let selectedVoicemail = voicemails[objectKey];

    let selectedSoundFile = document.querySelector(`.${objectKey}`);
    el.querySelectorAll(".comm").forEach(el => {
      el.classList.toggle('hide');
    });

    if (el.querySelector(".mute").classList.contains('hide')) {
      selectedSoundFile.muted = true;
      // selectedSoundFile.pause();
    } else {
      var timeElapsedNew2 = new Date().getTime();
      console.log(selectedVoicemail.timeVar);
      var timeElapsedOver2 = timeElapsedNew2 - selectedVoicemail.timeVar;
      let sec2 = Math.round(timeElapsedOver2 / 1000);

      selectedSoundFile.muted = false;

      if ((sec2 > selectedVoicemail.clipLength) || (selectedVoicemail.timeVar === 0)){
        console.log("replay");
        selectedSoundFile.currentTime = 0;
        selectedSoundFile.play();
        runVoicemailAnimation(objectKey);
      } else {}
    };
}));

document.querySelectorAll(".replay").forEach(el => el.addEventListener('click', () => {
  let parent = findAncestor(el, ".inter_voice");
  let objectKey = parent.dataset.name;
  let selectedSoundFile = document.querySelector(`.${objectKey}`);
  let thisVoicemailArray = voicemails[objectKey];
  thisVoicemailArray = thisVoicemailArray.array;
  console.log(thisVoicemailArray);


  if (thisVoicemailArray.length > 0) {
    for (let i = 0; i < thisVoicemailArray.length; i++) {
      clearTimeout(thisVoicemailArray[i]);
    }
  }
  if (parent.querySelector(".mute").classList.contains('hide')) {
    selectedSoundFile.muted = true;
  } else { selectedSoundFile.muted = false; }
    selectedSoundFile.currentTime = 0;
    selectedSoundFile.play();



  runVoicemailAnimation(objectKey);
}));


}; // window load



// Animate words by timing function //
var runQuoteAnimation = function() {

  timeElapsed = new Date().getTime();
  document.querySelectorAll(".box").forEach(function (box, i) {
    var fadeNumber = parseFloat(box.dataset.link);
      timeouts.push(setTimeout(function(){
        box.classList.add('fadeIn');
      }, (1000 * fadeNumber)));
  });



  document.querySelectorAll(".person").forEach(el => {
    var personEnd = parseFloat(el.dataset.end);
    var personStart = parseFloat(el.dataset.start);




    timeouts.push(setTimeout(function(){
      el.classList.add('animate');
    }, (1000 * personStart)));

    timeouts.push(setTimeout(function(){
      el.classList.remove('animate');
    }, ((1000 * personEnd) - 0.1)));
  });

  document.querySelectorAll(".allPersons .quote").forEach(el => {
    // var number = 0;
    var end = parseFloat(el.dataset.end);
    var start = parseFloat(el.dataset.start);
    var length = parseFloat(el.dataset.length);
    var overTime = end - start;
    var perEachWord = overTime / length;
    perEachWord = Math.floor((perEachWord + Number.EPSILON) * 100) / 100;

    timeouts.push(setTimeout(function(){
      eachSpan(el, perEachWord, timeouts);
    }, (1000 * start)));


  });
};


var eachSpan = function(quoteElement, timePerWord, timeoutArray) {
  quoteElement.querySelectorAll("span").forEach(function (each, i) {
    timeoutArray.push(setTimeout(function(){
      each.style.opacity = "1.0";
    }, (1000 * timePerWord * i)));

  });
};

var findAncestor = function (el, sel) {
  while ((el = el.parentElement) && !((el.matches || el.matchesSelector).call(el,sel)));
  return el;
};

var runVoicemailAnimation = function(voicemail) {

  let chosenObj = voicemails[voicemail];
  chosenObj.timeVar = new Date().getTime();

  let thisArray = chosenObj.array;

  let thisParent = document.querySelector(`[data-name=${voicemail}] .inter_person`);

  thisParent.querySelectorAll(".quote span").forEach(el => {
    el.style.opacity = 0.3;
  });

  thisParent.querySelectorAll(".quote").forEach(el => {
    let end2 = parseFloat(el.dataset.end);
    let start2 = parseFloat(el.dataset.start);
    let length2 = parseFloat(el.dataset.length);
    let overTime2 = end2 - start2;
    let perEachWord2 = overTime2 / length2;
    perEachWord2 = Math.floor((perEachWord2 + Number.EPSILON) * 100) / 100;

    thisArray.push(setTimeout(function(){
      eachSpan(el, perEachWord2, thisArray);
    }, (1000 * start2)));

  });

};
