var vb = new function () {
  var me = this,
    data = [],
    msg = window.SpeechSynthesisUtterance ? new SpeechSynthesisUtterance() : null,
    currentText,
    $quote = document.getElementById('quote'),
    $mouth = document.getElementById('brent-mouth'),
    $button = document.getElementById('brent-button'),
    $body = document.body,
    mouthStyle = $mouth.style;

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
        data=text.split('\n');
        getNewQuote();
      })
      .catch(function() {
        alert('Brent just gave up and went home. Please try again later.');
      });;

    $button.addEventListener('click', getNewQuote);
  }

  function say(text) {
    if (msg === null) {
      return;
    }

    $body.classList.add('animating');
    // cancel anything that is being spoken right now.
    speechSynthesis.cancel();

    currentText = text;

    var voices = window.speechSynthesis.getVoices();
    msg = window.SpeechSynthesisUtterance ? new SpeechSynthesisUtterance() : null
    msg.voice = voices[0];
    msg.rate = 1;
    msg.pitch = 1;
    msg.text = text;

    msg.addEventListener('boundary', onWordBoundary);

    msg.onend = function(e) {
      $body.classList.remove('animating');
      $quote.innerHTML = currentText;
    }

    requestAnimationFrame( function () {
      speechSynthesis.speak(msg);
    });

  }

  function getNewQuote() {
    var quoteNum =  randInt(0, data.length - 1);   // 82 35
    var quote = data[quoteNum].substring(17).replace(/&apos;/g, '\'').replace(/:[^\s]+:/g, '');
    console.clear();
    console.log(quoteNum);
    say(quote);
  }

  function syllable(word) {
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

  function onWordBoundary(e) {
    //var text = e.currentTarget.text;
    $mouth.className = '';
    var textUpToBoundary = currentText.substring(0, e.charIndex);
      var rest = currentText.substring(e.charIndex);
      var nextBoundary = rest.regexIndexOf(/\s/);
      var wordSpoken = rest.substring(0, nextBoundary);

      if (wordSpoken.trim() === '') {
        wordSpoken = currentText.substring(currentText.lastIndexOf(' '));
      }

      var syllables = syllable(wordSpoken);

      console.log(wordSpoken, syllables);
      mouthStyle.animationDuration=`${400/syllables}ms`;
      mouthStyle.animationIterationCount = syllables;
      $quote.innerHTML = (currentText.substring(0, e.charIndex + nextBoundary + 1));
    
    requestAnimationFrame(openMouth, 10);
  }

  function openMouth() {
    requestAnimationFrame(
      function () {
        $mouth.className = 'open';
      }
    );
  }

  me.init = function () {
    getData();
  }
}

String.prototype.regexIndexOf = function(regex, startpos) {
  var indexOf = this.substring(startpos || 0).search(regex);
  return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
}

vb.init();