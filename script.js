const startInterviewButtonElement = document.getElementById("start_interview");
const stopInterviewButtonElement = document.getElementById("stop_interview");
const videoElement = document.getElementById("video");
const captionsElement = document.getElementById("converted_voice_to_text");
const enableVideoElement = document.getElementById("enable_video");
const enableCaptionsElement = document.getElementById("enable_captions");
const voiceOptions = document.querySelector("select");
const voicePitch = document.getElementById("voice_pitch");
const voiceSpeed = document.getElementById("voice_speed");
const startWithIntroElement = document.getElementById("start_with_intro");
const nextQuestionCueElement = document.getElementById("next_question_cue");
const questionsElement = document.getElementById("questions");

// ----------------------------------------------------------------------------------------------------

videoElement.style.display = "none";
captionsElement.style.display = "none";

// ----------------------------------------------------------------------------------------------------

let nextQuestionCue = "";
let phrasesToBeRecognised = ["yes"];
let questions = [];
let voices = [];
let questionNumber = 1;
let i = 0;

// ----------------------------------------------------------------------------------------------------

const voicePreviewText = `Good ${getTimeOfDay()}!`;
const question1 = `Hello ${getUserName()}! Good ${getTimeOfDay()}! I am ${getAppName()} and I will be taking your interview. Shall we start?`;
const question2 = `Can we start with your introduction?`;
const questionLast = `We have come to the end of the interview. ${getUserName()}, it was nice to meet you. I can tell that you are a good candidate. Expect to hear from us within a week or so about the job. Thank you!`;
const noQuestion = `You have not entered the list of questions.`;
const noQuestionCue = `You have not entered the question cue.`;
const lightAcknowledgmentWords = ["Cool", "Okay", "Good", "Fine", "Alright"];
const strongAcknowledgementWords = [
  "Awesome",
  "Great",
  "Fantastic",
  "Impressive",
  "Splendid",
  "Brilliant",
];

// ----------------------------------------------------------------------------------------------------

const speechSynthesis = getSpeechSynthesis();

// ----------------------------------------------------------------------------------------------------

startInterviewButtonElement.addEventListener("click", function (event) {
  startInterview();
});

stopInterviewButtonElement.addEventListener("click", function (event) {
  stopInterview();
});

voiceOptions.onchange = function () {
  convertTextToVoice(speechSynthesis, voicePreviewText);
};

voicePitch.onchange = function () {
  convertTextToVoice(speechSynthesis, voicePreviewText);
};

voiceSpeed.onchange = function () {
  convertTextToVoice(speechSynthesis, voicePreviewText);
};

window.onload = (e) => {
  speechSynthesis.cancel();
};

function startInterview() {
  nextQuestionCue = nextQuestionCueElement.value;

  if (nextQuestionCue === "") {
    convertTextToVoice(speechSynthesis, noQuestionCue);
    return;
  }

  setQuestions();

  if (questions.length == 0) {
    convertTextToVoice(speechSynthesis, noQuestion);
    return;
  }

  phrasesToBeRecognised.push(nextQuestionCue);

  setButtons();

  setCamera();

  setCaptions();

  convertTextToVoice(speechSynthesis, questions[i]);
}

function setQuestions() {
  const questionsInDivElements = Array.from(
    questionsElement.getElementsByTagName("div")
  )
    .map((divElement) => divElement.getElementsByTagName("input")[0].value)
    .filter((question) => question);

  if (questionsInDivElements.length == 0) {
    return;
  }

  if (!startWithIntroElement.checked) {
    questions = [question1, ...questionsInDivElements, questionLast];
    return;
  }

  questions = [question1, question2, ...questionsInDivElements, questionLast];
}

function setButtons() {
  startInterviewButtonElement.disabled = true;
  stopInterviewButtonElement.disabled = false;
}

function setCamera() {
  if (enableVideoElement.checked == true) {
    startCamera();
    videoElement.style.display = "block";
  } else {
    videoElement.style.display = "none";
  }
}

function setCaptions() {
  if (enableCaptionsElement.checked == true) {
    captionsElement.style.display = "block";
  } else {
    captionsElement.style.display = "none";
  }
}

function stopInterview() {
  resetButtons();

  resetCamera();

  resetCaptions();

  speechSynthesis.cancel();

  nextQuestionCue = "";
  phrasesToBeRecognised = [];
  questions = [];
  questionNumber = 1;
  i = 0;
}

function resetButtons() {
  startInterviewButtonElement.disabled = false;
  stopInterviewButtonElement.disabled = true;
}

function resetCamera() {
  if (enableVideoElement.checked == true) {
    stopCamera();
    videoElement.style.display = "none";
  }
}

function resetCaptions() {
  if (enableCaptionsElement.checked == true) {
    captionsElement.style.display = "none";
  }
}

function getSpeechSynthesis() {
  const speechSynthesis = window.speechSynthesis;

  speechSynthesis.onvoiceschanged = setupVoices;

  return speechSynthesis;
}

function setupVoices() {
  voices = getVoicesInSortedOrder();
  createVoiceOptions();
}

function getVoicesInSortedOrder() {
  let voices = speechSynthesis
    .getVoices()
    .filter(
      (voice) =>
        voice.name.startsWith("Microsoft") && voice.name.includes("English")
    )
    .sort(function (a, b) {
      const aName = a.name.toUpperCase();
      const bName = b.name.toUpperCase();

      if (aName > bName) return +1;
      if (aName < bName) return -1;
      return 0;
    });
  return voices;
}

function createVoiceOptions() {
  const selectedIndex =
    voiceOptions.selectedIndex < 0 ? 0 : voiceOptions.selectedIndex;

  voiceOptions.innerHTML = "";

  for (let i = 0; i < voices.length; i++) {
    createVoiceOption(i);
  }

  voiceOptions.selectedIndex = selectedIndex;
}

function createVoiceOption(i) {
  const option = document.createElement("option");
  option.textContent = `${voices[i].name} (${voices[i].lang})`;

  if (voices[i].default) {
    option.textContent += " -- DEFAULT";
  }

  option.setAttribute("data-lang", voices[i].lang);
  option.setAttribute("data-name", voices[i].name);
  voiceOptions.appendChild(option);
}

function convertVoiceToText() {
  const speechRecognition = getSpeechRecognition();
  speechRecognition.start();
}

function getSpeechRecognition() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const speechRecognition = new SpeechRecognition();

  setSpeechRecognitionProperties(speechRecognition);
  handleSpeechRecognitionEvents(speechRecognition);

  return speechRecognition;
}

function setSpeechRecognitionProperties(speechRecognition) {
  const grammar = `#JSGF V1.0; grammar phrases; public <phrase> = ${phrasesToBeRecognised.join(
    " | "
  )};`;

  const SpeechGrammarList =
    window.SpeechGrammarList || window.webkitSpeechGrammarList;
  const speechGrammarList = new SpeechGrammarList();
  speechGrammarList.addFromString(grammar, 1);

  speechRecognition.grammars = speechGrammarList;
  speechRecognition.lang = "en-IN";
  speechRecognition.interimResults = false;
  speechRecognition.maxAlternatives = 1;
  speechRecognition.continuous = true;
}

function handleSpeechRecognitionEvents(speechRecognition) {
  speechRecognition.onresult = function (event) {
    var speechRecognitionResultList = event.results;
    var speechRecognitionEventResultIndex = event.resultIndex;
    var speechRecognitionResult =
      speechRecognitionResultList[speechRecognitionEventResultIndex];
    var speechRecognitionAlternative = speechRecognitionResult[0];
    var transcript = speechRecognitionAlternative.transcript.toLowerCase();

    console.log(event.results);
    console.log(transcript);

    if (transcript.includes(nextQuestionCue)) {
      console.log("word recognised i.e. = " + nextQuestionCue);
      speechRecognition.stop();
    }

    captionsElement.textContent = transcript;
  };

  speechRecognition.onerror = function (event) {
    const error = "Error occurred in recognition: " + event.error;
    captionsElement.innerHTML = error;
    console.error(error);
    console.error("SpeechRecognition.onerror");
    speechRecognition.abort();
  };

  speechRecognition.onnomatch = function (event) {
    //Fired when the speech recognition service returns a final result with no significant recognition. This may involve some degree of recognition, which doesn't meet or exceed the confidence threshold.
    console.info("SpeechRecognition.onnomatch");
  };

  speechRecognition.onstart = function (event) {
    //Fired when the speech recognition service has begun listening to incoming audio with intent to recognize grammars associated with the current SpeechRecognition.
    console.info("SpeechRecognition.onstart");
  };

  speechRecognition.onend = function (event) {
    i++;

    convertTextToVoice(speechSynthesis, questions[i]);

    //Fired when the speech recognition service has disconnected.
    console.info("SpeechRecognition.onend");
  };

  speechRecognition.onaudiostart = function (event) {
    //Fired when the user agent has started to capture audio.
    console.info("SpeechRecognition.onaudiostart");
  };

  speechRecognition.onaudioend = function (event) {
    //Fired when the user agent has finished capturing audio.
    console.info("SpeechRecognition.onaudioend");
  };

  speechRecognition.onsoundstart = function (event) {
    //Fired when any sound — recognisable speech or not — has been detected.
    console.info("SpeechRecognition.onsoundstart");
  };

  speechRecognition.onsoundend = function (event) {
    //Fired when any sound — recognisable speech or not — has stopped being detected.
    console.info("SpeechRecognition.onsoundend");
  };

  speechRecognition.onspeechstart = function (event) {
    //Fired when sound that is recognised by the speech recognition service as speech has been detected.
    console.info("SpeechRecognition.onspeechstart");
  };

  speechRecognition.onspeechend = function (event) {
    //Fired when speech recognized by the speech recognition service has stopped being detected.
    console.info("SpeechRecognition.onspeechend");
  };
}

function convertTextToVoice(speechSynthesis, textToBeConvertedToVoice) {
  if (speechSynthesis.speaking) {
    console.info("speechSynthesis.speaking");
    console.info("speechSynthesis is currently speaking. ");
    speechSynthesis.cancel();
  }

  const speechSynthesisUtterance = getSpeechSynthesisUtterance(
    textToBeConvertedToVoice
  );
  speechSynthesis.speak(speechSynthesisUtterance);
}

function getSpeechSynthesisUtterance(textToBeConvertedToVoice) {
  const speechSynthesisUtterance = new SpeechSynthesisUtterance(
    textToBeConvertedToVoice
  );

  setSpeechSynthesisUtteranceProperties(speechSynthesisUtterance);
  handleSpeechSynthesisUtteranceEvents(speechSynthesisUtterance);

  return speechSynthesisUtterance;
}

function setSpeechSynthesisUtteranceProperties(speechSynthesisUtterance) {
  const selectedOption =
    voiceOptions.selectedOptions[0].getAttribute("data-name");

  for (let i = 0; i < voices.length; i++) {
    if (voices[i].name === selectedOption) {
      speechSynthesisUtterance.voice = voices[i];
      break;
    }
  }

  speechSynthesisUtterance.pitch = voicePitch.value;
  speechSynthesisUtterance.rate = voiceSpeed.value;
}

function handleSpeechSynthesisUtteranceEvents(speechSynthesisUtterance) {
  speechSynthesisUtterance.onend = function (event) {
    if (!startInterviewButtonElement.disabled) {
      return;
    }

    if (questions[i + 1] === undefined) {
      stopInterview();
      return;
    }

    convertVoiceToText();

    console.info("SpeechSynthesisUtterance.onend");
    console.info("speechSynthesis has ended.");
  };

  speechSynthesisUtterance.onerror = function (event) {
    console.error("SpeechSynthesisUtterance.onerror");
    console.error("speechSynthesis has an error.");
  };
}

function getTimeOfDay() {
  const now = new Date();
  const hour = now.getHours();

  if (hour >= 6 && hour < 12) {
    return "morning";
  } else if (hour >= 12 && hour < 18) {
    return "afternoon";
  } else {
    return "evening";
  }
}

function getUserName() {
  return "Tony";
}

function getAppName() {
  return "InterviewMe";
}

function getRandomWord(arr) {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

function startCamera() {
  const constraints = { video: true };

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      videoElement.srcObject = stream;
      videoElement.play();
    })
    .catch((error) => {
      console.error(`Unable to access camera: ${error}`);
    });
}

function stopCamera() {
  const stream = videoElement.srcObject;
  const tracks = stream.getTracks();

  tracks.forEach((track) => {
    track.stop();
  });

  videoElement.srcObject = null;
}

function createNewQuestionField() {
  let questionsElement = document.getElementById("questions");
  let divElement = document.createElement("div");
  let inputElement = document.createElement("input");
  let nextQuestionButtonElement = document.getElementById("nextQuestion");

  nextQuestionButtonElement.remove();
  inputElement.setAttribute("type", "text");
  inputElement.setAttribute("name", `question${++questionNumber}`);
  inputElement.setAttribute("placeholder", `Question ${questionNumber}`);
  divElement.appendChild(inputElement);
  questionsElement.appendChild(divElement);
  questionsElement.appendChild(nextQuestionButtonElement);
}

function removeElement() {
  var elementToRemove = document.querySelector(".container1");
  var elementToAdd = document.querySelector(".container2");
  elementToRemove.classList.add("hide");
  elementToAdd.classList.remove("hide");
}
