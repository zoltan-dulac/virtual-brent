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
    fallbackTimeout,
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition)(),
    possibleResponses = [];

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
        data=text.replace(/&apos;/g, '\'').replace(/:[^\s]+:/g, '').split('\n');
        startListening();
        if (window.speechSynthesis.getVoices().length === 0) {
          window.speechSynthesis.onvoiceschanged = function() {
            //getNewQuote();
          };
        } else {
          //getNewQuote();
        }
      })
      .catch(function() {
        alert('Brent just gave up and went home. Please try again later.');
      });;

    $body.addEventListener('click', getNewQuote);
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
    console.log(voices);
    msg = window.SpeechSynthesisUtterance ? new SpeechSynthesisUtterance() : null
    msg.voice = voices[0];
    msg.rate = 1;
    msg.pitch = 1;
    msg.text = text;

    fallbackTimeout = setTimeout(function() {
      $quote.innerHTML = text;
    }, 100);

    msg.addEventListener('boundary', onWordBoundary);

    msg.onend = function(e) {
      requestAnimationFrame(function() {
        $body.classList.remove('animating');
        $quote.innerHTML = currentText;
      })
     
    }

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
    if (fallbackTimeout) {
      clearTimeout(fallbackTimeout);
    }
    $mouth.className = '';
    var textUpToBoundary = currentText.substring(0, e.charIndex);
      var rest = currentText.substring(e.charIndex);
      var nextBoundary = rest.regexIndexOf(/\s/);
      var wordSpoken = rest.substring(0, nextBoundary);

      if (wordSpoken.trim() === '') {
        wordSpoken = currentText.substring(currentText.lastIndexOf(' '));
      }

      var syllables = syllable(wordSpoken);

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

  /*
   * Let's make Brent a Good Listener.
   */
  function setRecognitionEvents() {
    [
      //'audiostart',
      'audioend',
      /* 'end',
      'error',
      'nomatch',
      'result', 
      'soundstart',
      'soundend',*/
      //'speechend',
      //'start'
     ].forEach(function(eventName) {
       recognition.addEventListener(eventName, function(e) {
         //console.log(eventName, e);
       });
     });

     recognition.addEventListener('end', recognitionEndEvent);
     recognition.addEventListener('result', resultEvent);
     //recognition.addEventListener('speechend', speechEndEvent);
  }

  function recognitionEndEvent(e) {
    startListening();
  }

  function guessTheSubject(sentence) {
    var terms = nlp(sentence).terms().data();
    
    for (var i=0; i<terms.length; i++) {
      var term = terms[i];

      if (term.bestTag === "Noun" && term.tags.indexOf('Pronoun') < 0) {
        console.log('chosen term:', term);
        return term.normal;
      }
    }

    return "";
  }

  function resultEvent(e) {
    
    var finalResult = e.results[0][0].transcript;
    var noun = guessTheSubject(finalResult);
    console.log('result event', e, noun);
    say(finalResult);
    possibleResponses = nounIndex[noun];
    

    if (possibleResponses && possibleResponses.length > 0) {
      var resultIndex = randInt(0, possibleResponses.length - 1);
      var response = data[possibleResponses[resultIndex]];
      console.log('result:', response);
      say(response);
    }
  }

  function startListening() {
    console.log('listening');
    recognition.start();

		
		/* recognition.onresult = function() {
			document.querySelector('#demo-echo').textContent = event.results[0][0].transcript;
		}; */
  };


  me.init = function () {
		recognition.lang = 'en-US';
		recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setRecognitionEvents();
    getData();
  }
}

String.prototype.regexIndexOf = function(regex, startpos) {
  var indexOf = this.substring(startpos || 0).search(regex);
  return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
}

vb.init();
