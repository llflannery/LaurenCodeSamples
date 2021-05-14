var paywall = require("./lib/paywall");
setTimeout(() => paywall(12371667), 5000);
require('waypoints/lib/noframework.waypoints.min');
const $ = require('jquery');
const async = require("async");

require("component-responsive-frame/child");
const ready = require("./brightcove");

$( ".nav-container" ).click(function() {
  $('.nav-list').toggleClass('showMenu');
});


function updateScrollBar() {
  const docHeight = ($( document ).height()) - ($( window ).height());
  let position = $(window).scrollTop();
  var percentage = ((position / docHeight) * 100);
  $('#navScroll').css("width", `${percentage}%`);
}

var soundOn = false;
$( document ).ready(function() {
  updateScrollBar();

$( document ).scroll(function() {
  updateScrollBar();
});



$( "#sound" ).click(function() {

  soundOn = true;

  $(this).toggleClass('unmute');
   if ( $(this).hasClass('unmute') ) {

     $('html,body').animate({
       scrollTop: $('#firstVid').offset().top
     });

    for (let i in players) {
       var thisVid = players[i];
       jwplayer(thisVid).setConfig({"mute": false});
   };
   }
});

// Ernestina's video code
$( ".brightcove__button" ).click(function() {
  $( "#looper" ).hide();
  $( ".brightcove__button" ).hide();
  jwplayer("botr_fVmRn0TL_UXknQA8J_div").play();
  jwplayer("botr_fVmRn0TL_UXknQA8J_div").setCurrentCaptions(1);
});


// fade in video, check mute status, stick to top of page and autoplay
function makeVideoWaypoints(myVids) {
  $('.slideVid').each((index, element) => {

    let startVid;
    let bringForward;
    var theVid = myVids[index];


    jwplayer(theVid).on('playAttemptFailed', (e) => {
      console.log(e);
    });

     jwplayer(theVid).setConfig({"mute": true});

     let nextSection = $(`#${theVid}`).closest('.slideVid').next('.sectionHed').get(0);

     jwplayer(theVid).on('complete', () => {
       $('html,body').animate({
         scrollTop: $(nextSection).offset().top
       });
     });

      function playVid() {
        jwplayer(theVid).setCurrentCaptions(0);
        jwplayer(theVid).play();

      }

      function pauseVid() {
        jwplayer(theVid).pause();
      }

          $(element).ready(function() {
            var player = this;

            new Waypoint({
                element: element,
                enabled: false,
                handler: function(direction) {
                  if(direction === "down") {

                    $(element).find('.stickMe').css("z-index","5");
                    startVid = setTimeout(playVid, 1200);

                    $(element).find('.stickMe').fadeTo( 500, 1 );
                    $(element).find('.aspect-inner').delay( 700 ).fadeTo( 500, 1 );
                  }
                  else if (direction === "up") {
                    clearTimeout(startVid);
                    setTimeout(pauseVid, 300);
                    $(element).find('.aspect-inner').fadeTo( 500, 0 );
                    $(element).find('.stickMe').delay(500).fadeTo( 500, 0 );

                    bringForward = setTimeout(function(){
                      $(element).find('.stickMe').css("z-index","-1");
                    }, 1000);

                  }
                },
                offset: '80%'
            });

            // Reverse fades and pause video if person scrolls through video
            new Waypoint({
                element: element,
                enabled: false,
                handler: function(direction) {
                  if(direction === "down") {
                    clearTimeout(startVid);

                    setTimeout(pauseVid, 300);
                    $(element).find('.aspect-inner').fadeTo( 500, 0 );
                    $(element).find('.stickMe').delay(500).fadeTo( 500, 0 );
                    setTimeout(function(){
                      $(element).find('.stickMe').css("z-index","-1");
                    }, 1000);
                  }
                  else if (direction === "up") {
                    $(element).find('.stickMe').css("z-index","5");
                    startVid = setTimeout(playVid, 1200);
                    $(element).find('.stickMe').fadeTo( 500, 1 );
                    $(element).find('.aspect-inner').delay( 700 ).fadeTo( 500, 1 );
                  }
                },
                offset: '-20%'
            });
          });

          });

          setTimeout(function(){
            Waypoint.enableAll();
          }, 250);
      };


// Stick large image to top of page as background, fade in, scroll over blocks of text

$('.fixedTexts').each((order, item) => {
      var $this = item;
      var $items = $($this).find(".text");

      var stickCon = $($this).prev();

        $($items).each((index, element) => {

                $(element).ready(function() {
                  let order = parseInt( $(element).data("order") );

                  var divInside = $(element).children(":first");


                  new Waypoint({
                      element: element,
                      enabled: false,
                      handler: function(direction) {
                        if(direction === "down") {
                          $(stickCon).css("z-index","3");
                          $('.fixedContainer .pics').finish();

                          if ( $(element).hasClass('text-front') ){
                            $(element).closest('.fixedTotal').find(`.fixedContainer .pics:nth-child(${order})`).delay(200).fadeTo(1000,1);

                            if ( $(element).closest('.fixedTotal').find(`.fixedContainer .pics:nth-child(${order})`).hasClass('changeMyBackground') ) {
                              $(element).closest('.fixedTotal').find(`.stickMe`).addClass('specialBackground');
                            } else {}
                          } else if ( $(element).hasClass('text-back')  || ($(element).hasClass('text-mid')) ) {

                          } else {
                            $(element).closest('.fixedTotal').find(`.fixedContainer .pics:nth-child(${order})`).delay(200).fadeTo(1000,1);
                            if ( $(element).closest('.fixedTotal').find(`.fixedContainer .pics:nth-child(${order})`).hasClass('changeMyBackground') ) {
                              $(element).closest('.fixedTotal').find(`.stickMe`).removeClass('specialBackground');
                            } else {}
                          }

                        }
                        else if (direction === "up") {
                          if ( $(element).hasClass('text-back') || ($(element).hasClass('text-mid')) ){

                          } else if ( $(element).hasClass('text-front') ){
                            if ( $(element).closest('.fixedTotal').find(`.fixedContainer .pics:nth-child(${order})`).hasClass('changeMyBackground') ) {
                              $(element).closest('.fixedTotal').find(`.stickMe`).removeClass('specialBackground');
                            } else {}
                            $(element).closest('.fixedTotal').find(`.fixedContainer .pics:nth-child(${order})`).stop().fadeTo(500,0);
                            setTimeout(function(){
                                $(stickCon).css("z-index","-1");
                            }, 500);
                          } else {

                            $(element).closest('.fixedTotal').find(`.fixedContainer .pics:nth-child(${order})`).stop().fadeTo(500,0);
                            setTimeout(function(){
                                $(stickCon).css("z-index","-1");
                            }, 500);
                          }



                        }
                      },
                      offset: '90%'
                  });

                  // Reverse fades at the end and send everything to zero opacity
                  new Waypoint({
                      element: divInside[0],
                      enabled: false,
                      handler: function(direction) {
                        if(direction === "down") {
                          if ( $(element).hasClass('text-front') || ($(element).hasClass('text-mid')) ){
                          } else if ( $(element).hasClass('text-back') ) {
                            $(element).closest('.fixedTotal').find(`.fixedContainer .pics:nth-child(${order})`).fadeTo(500,0);
                            if ( $(element).closest('.fixedTotal').find(`.fixedContainer .pics:nth-child(${order})`).hasClass('changeMyBackground') ) {
                              $(element).closest('.fixedTotal').find(`.stickMe`).removeClass('specialBackground');
                            } else {}
                          } else {
                            $(element).closest('.fixedTotal').find(`.fixedContainer .pics:nth-child(${order})`).fadeTo(500,0);
                          }

                          setTimeout(function(){
                              $(stickCon).css("z-index","-1");
                          }, 500);

                        }
                        else if (direction === "up") {
                          $(stickCon).css("z-index","3");
                          if ( ($(element).hasClass('text-front')) || ($(element).hasClass('text-mid')) ){
                            } else if ( $(element).hasClass('text-back') ) {
                              $(element).closest('.fixedTotal').find(`.fixedContainer .pics:nth-child(${order})`).fadeTo(1000,1);
                              if ( $(element).closest('.fixedTotal').find(`.fixedContainer .pics:nth-child(${order})`).hasClass('changeMyBackground') ) {
                                $(element).closest('.fixedTotal').find(`.stickMe`).addClass('specialBackground');
                              } else {}
                            } else {
                            $(element).closest('.fixedTotal').find(`.fixedContainer .pics:nth-child(${order})`).fadeTo(1000,1);
                            if ( $(element).closest('.fixedTotal').find(`.fixedContainer .pics:nth-child(${order})`).hasClass('changeMyBackground') ) {
                              $(element).closest('.fixedTotal').find(`.stickMe`).removeClass('specialBackground');
                            } else {}
                          }
                        }
                      },
                      offset: '-5%'
                  });


                }); // end of element ready
    });
  }); // end of fixedTexts


  // If fades are still happening at the end of each section, speed through them
  $('.clearPoint').each((order, element) => {

      $(element).ready(function() {
        new Waypoint({
            element: element,
            enabled: false,
            handler: function(direction) {

              if(direction === "down") {
                console.log('clear point ' + direction);

                $(document).finish();
                $(`.fixedContainer .pics`).fadeTo(0,0);
              }
              else if (direction === "up") {
              }
            },
            offset: '0%'
        });

        new Waypoint({
            element: element,
            enabled: false,
            handler: function(direction) {
              if(direction === "down") {
              }
              else if (direction === "up") {
                console.log('clear point ' + direction);
                $(document).finish();
              }
            },
            offset: '0%'
        });

      });

    });





  setTimeout(function(){
    Waypoint.enableAll();
  }, 250);


// Load video player
var players = [
  "botr_kYMtkpej_UXknQA8J_div",
  "botr_CiMoQrTS_UXknQA8J_div",
  "botr_SALIaO69_UXknQA8J_div",
  "botr_CNwBm3qL_UXknQA8J_div",
  "botr_FLiLVqo6_UXknQA8J_div",
  "botr_6J9jLNno_UXknQA8J_div",
  "botr_D3t09xr4_UXknQA8J_div"
];

var playerErnestina = {
  17: "player-8",
}


makeVideoWaypoints(players);




// Smooth Scroll through the whole piece
//Select all links with hashes
$('a[href*="#"]')
  .not('[href="#"]')
  .not('[href="#0"]')
  .click(function(event) {

    Waypoint.disableAll();

    if (
      location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '')
      &&
      location.hostname == this.hostname
    ) {
      // Figure out element to scroll to
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
      // Does a scroll target exist?
      if (target.length) {
        // Only prevent default if animation is actually gonna happen
        event.preventDefault();
        $('html, body').animate({
          scrollTop: target.offset().top
        }, 1000, function() {
          // Callback after animation
          // Must change focus!
          var $target = $(target);
          $target.focus();
          if ($target.is(":focus")) { // Checking if the target was focused
            return false;
          } else {
            $target.attr('tabindex','-1'); // Adding tabindex for elements not focusable
            $target.focus(); // Set focus again
          };
        });
      }
    }
    setTimeout(function(){
      Waypoint.enableAll();
    }, 2000);
  });



}); // doc ready
