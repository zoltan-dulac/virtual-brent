var vb = new function () {
  var me = this,
    data = [],
    msg = window.SpeechSynthesisUtterance ? new SpeechSynthesisUtterance() : null,
    currentText,
    $quote = document.getElementById('quote'),
    $mouth = document.getElementById('brent-mouth'),
    $button = document.getElementById('brent-button'),
    $body = document.body,
    mouthStyle = $mouth.style,
    fallbackTimeout;

  /*
   * Returns a random number between min and max (inclusive).
   */
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getData() {
    var xhr = fetch('brent.dat', { method: 'GET'})
      .then(function(response) {
        if (response.ok) {
          return response.text();
        } else {
          return false;
        }
      })
      .then(function(text) {
        // replace &apos; with ' and remove :slack-emoji-labels:
        data=text.replace(/&apos;/g, '\'').replace(/:[a-z0-9]:/g, '').split('\n');
        if (window.speechSynthesis.getVoices().length === 0) {
          window.speechSynthesis.onvoiceschanged = function() {
            getNewQuote();
          };
        } else {
          getNewQuote();
        }
      })
      .catch(function() {
        // give a witty alert when something goes wrong.
        alert('Brent just gave up and went home. Please try again later.');
      });;

    $body.addEventListener('click', getNewQuote);
  }

  function say(text) {
    if (msg === null) {
      return;
    }

    // let's open that mouth .
    $body.classList.add('animating');

    // cancel anything that is being spoken right now.
    speechSynthesis.cancel();

    currentText = text;

    /*
     * Since I don't know the best way to pick voices yet, we are just going to 
     * assume the first one is the best.
     */
    var voices = window.speechSynthesis.getVoices();
    console.log(voices);
    msg = window.SpeechSynthesisUtterance ? new SpeechSynthesisUtterance() : null
    msg.voice = voices[0];
    msg.rate = 1;
    msg.pitch = 1;
    msg.text = text;

    /*fallbackTimeout = setTimeout(function() {
      $quote.innerHTML = text;
    }, 300); */

    // this is the event that fires when the end of a word is spoken
    msg.addEventListener('boundary', onWordBoundaryEvent);

    // this is the event that fires once the while string is said.
    msg.addEventListener('end', onEndEvent);

    requestAnimationFrame( function () {
      speechSynthesis.speak(msg);
    });
  }

  function getNewQuote(n) {
    var quoteNum;

    if (typeof(n) === 'number') {
      quoteNum = n;
    } else {
      quoteNum =  randInt(0, data.length - 1);   // 82 35
    }
    
    var quote = data[quoteNum];
    
    say(quote);
  }

  /*
   * A very naive way to find the number of syllables in a word.  Uses so we
   * can make the mouth movement look more accurate.  Not always 100% accurate,
   * but good enough for our purposes.
   * 
   * This function originally from
   * https://stackoverflow.com/questions/5686483/how-to-compute-number-of-syllables-in-a-word-in-javascript
   *
   */
  function syllable(word) {
    console.log(word);
    word = word.trim();
    
    if (word.match(/^[0-9]+$/)) {
      return 1;
    } else if (!word.match(/[a-z]/i)) {
      return 0;
    }

    word = word.toLowerCase();                                     //word.downcase!
    if(word.length <= 3) { return 1; }                             //return 1 if word.length <= 3
      word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');   //word.sub!(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
      word = word.replace(/^y/, '');                                 //word.sub!(/^y/, '')
      var matches =  word.match(/[aeiouy]{1,2}/g);
      return matches ? matches.length : 1;                    //word.scan(/[aeiouy]{1,2}/).size
  }

  function onWordBoundaryEvent(e) {
    //var text = e.currentTarget.text;
    if (fallbackTimeout) {
      clearTimeout(fallbackTimeout);
    }
    $mouth.className = '';
    var textUpToBoundary = currentText.substring(0, e.charIndex);
      var rest = currentText.substring(e.charIndex);
      var nextBoundary = rest.regexIndexOf(/\s/);
      var wordSpoken = rest.substring(0, nextBoundary);
    
      console.log(e, rest);

      if (wordSpoken.trim() === '') {
        wordSpoken = currentText.substring(currentText.lastIndexOf(' '));
      }

      var syllables = syllable(wordSpoken);

      mouthStyle.animationDuration=`${400/syllables}ms`;
      mouthStyle.animationIterationCount = syllables;
      $quote.innerHTML = (currentText.substring(0, e.charIndex + nextBoundary + 1));
    
    if (rest.match(/[a-z0-9]/i)) {
      requestAnimationFrame(openMouth, 5);
    }
  }

  function onEndEvent(e) {
    $body.classList.remove('animating');
    $quote.innerHTML = currentText;
  }

  function openMouth() {
    requestAnimationFrame(
      function () {
        $mouth.className = 'open';
      }
    );
  }


  me.init = function () {
    // use the fetch polyfill if we need it.
    if (!window.fetch) {
      window.fetch = unfetch;
    }
    getData();
  }
}

String.prototype.regexIndexOf = function(regex, startpos) {
  var indexOf = this.substring(startpos || 0).search(regex);
  return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
}

vb.init();
