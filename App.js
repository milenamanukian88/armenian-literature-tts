const readingSelect = document.getElementById("readingSelect");
const readingList = document.getElementById("readingList");
const storyTitle = document.getElementById("storyTitle");
const storyAuthor = document.getElementById("storyAuthor");
const storyText = document.getElementById("storyText");
const playPauseButton = document.getElementById("playPauseButton");
const replayButton = document.getElementById("replayButton");
const languageSelect = document.getElementById("languageSelect");
const speedControl = document.getElementById("speedControl");
const speedOutput = document.getElementById("speedOutput");
const voiceSelect = document.getElementById("voiceSelect");
const textSizeControl = document.getElementById("textSizeControl");
const textSizeOutput = document.getElementById("textSizeOutput");

let currentIndex = 0;
let voices = [];
let utterance = null;
let isPlaying = false;

function splitParagraphs(text) {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function renderReadings() {
  READINGS.forEach((reading, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${reading.title} — ${reading.author}`;
    readingSelect.appendChild(option);

    const card = document.createElement("button");
    card.type = "button";
    card.className = "reading-card";
    card.innerHTML = `<strong>${reading.title}</strong><small>${reading.author}</small>`;
    card.addEventListener("click", () => selectReading(index));
    readingList.appendChild(card);
  });
}

function selectReading(index) {
  stopSpeech();
  currentIndex = index;
  const reading = READINGS[index];
  readingSelect.value = String(index);
  storyTitle.textContent = reading.title;
  storyAuthor.textContent = reading.author;
  storyText.innerHTML = splitParagraphs(reading.text)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");

  document.querySelectorAll(".reading-card").forEach((card, cardIndex) => {
    card.classList.toggle("active", cardIndex === index);
  });
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function populateVoices() {
  voices = speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith("en"));

  voiceSelect.innerHTML = "";
  voices.forEach((voice, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect.appendChild(option);
  });

  if (!voices.length) {
    const option = document.createElement("option");
    option.textContent = "Default English voice";
    option.value = "";
    voiceSelect.appendChild(option);
  }
}

function makeUtterance() {
  const reading = READINGS[currentIndex];
  const nextUtterance = new SpeechSynthesisUtterance(reading.text);
  nextUtterance.lang = languageSelect.value;
  nextUtterance.rate = Number(speedControl.value);

  const selectedVoice = voices[Number(voiceSelect.value)];
  if (selectedVoice) {
    nextUtterance.voice = selectedVoice;
  }

  nextUtterance.onend = () => {
    isPlaying = false;
    playPauseButton.textContent = "Play";
  };

  nextUtterance.onerror = () => {
    isPlaying = false;
    playPauseButton.textContent = "Play";
  };

  return nextUtterance;
}

function playOrPause() {
  if (speechSynthesis.speaking && !speechSynthesis.paused) {
    speechSynthesis.pause();
    isPlaying = false;
    playPauseButton.textContent = "Play";
    return;
  }

  if (speechSynthesis.paused) {
    speechSynthesis.resume();
    isPlaying = true;
    playPauseButton.textContent = "Pause";
    return;
  }

  utterance = makeUtterance();
  speechSynthesis.speak(utterance);
  isPlaying = true;
  playPauseButton.textContent = "Pause";
}

function stopSpeech() {
  if (speechSynthesis.speaking || speechSynthesis.pending || speechSynthesis.paused) {
    speechSynthesis.cancel();
  }
  isPlaying = false;
  playPauseButton.textContent = "Play";
}

function replaySpeech() {
  stopSpeech();
  utterance = makeUtterance();
  speechSynthesis.speak(utterance);
  isPlaying = true;
  playPauseButton.textContent = "Pause";
}

readingSelect.addEventListener("change", (event) => {
  selectReading(Number(event.target.value));
});

playPauseButton.addEventListener("click", playOrPause);
replayButton.addEventListener("click", replaySpeech);

speedControl.addEventListener("input", () => {
  speedOutput.textContent = `${Number(speedControl.value).toFixed(1)}x`;
});

textSizeControl.addEventListener("input", () => {
  const size = Number(textSizeControl.value);
  storyText.style.fontSize = `${size}px`;
  textSizeOutput.textContent = `${size}px`;
});

voiceSelect.addEventListener("change", () => {
  stopSpeech();
});

languageSelect.addEventListener("change", () => {
  stopSpeech();
});

window.addEventListener("beforeunload", stopSpeech);
speechSynthesis.addEventListener("voiceschanged", populateVoices);

renderReadings();
populateVoices();
selectReading(0);
