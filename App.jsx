import { useEffect, useRef, useState } from "react";
import ButtonGrid from "./components/ButtonGrid.jsx";
import ScoreBoard from "./components/ScoreBoard.jsx";

const colors = ["red", "green", "blue", "yellow"];

const colorFrequencies = {
  red: 261.63,
  green: 329.63,
  blue: 392.0,
  yellow: 523.25
};

function App() {
  const [sequence, setSequence] = useState([]);
  const [userInput, setUserInput] = useState([]);
  const [level, setLevel] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [activeColor, setActiveColor] = useState(null);

  const timersRef = useRef([]);
  const audioContextRef = useRef(null);

  useEffect(() => {
    if (!isStarted || sequence.length === 0 || isGameOver) {
      return;
    }

    playSequence(sequence);
  }, [sequence, isStarted, isGameOver]);

  useEffect(() => {
    return () => {
      clearTimers();
      closeAudioContext();
    };
  }, []);

  function clearTimers() {
    for (let i = 0; i < timersRef.current.length; i++) {
      clearTimeout(timersRef.current[i]);
    }

    timersRef.current = [];
  }

  function closeAudioContext() {
    if (
      audioContextRef.current &&
      audioContextRef.current.state !== "closed"
    ) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }

  function getAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }

  function playTone(frequency, duration = 0.18, delay = 0) {
    const audioContext = getAudioContext();

    if (!audioContext) {
      return;
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const startTime = audioContext.currentTime + delay;
    const stopTime = startTime + duration;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startTime);

    gainNode.gain.setValueAtTime(0.001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.18, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, stopTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(startTime);
    oscillator.stop(stopTime);
  }

  function playColorSound(color) {
    const frequency = colorFrequencies[color];

    if (!frequency) {
      return;
    }

    playTone(frequency);
  }

  function playGameOverSound() {
    playTone(220, 0.12, 0);
    playTone(174.61, 0.12, 0.15);
    playTone(130.81, 0.24, 0.3);
  }

  function getRandomColor() {
    const randomIndex = Math.floor(Math.random() * colors.length);
    return colors[randomIndex];
  }

  function flashColor(color) {
    setActiveColor(color);
    playColorSound(color);

    const removeFlashTimer = setTimeout(function () {
      setActiveColor(function (currentColor) {
        if (currentColor === color) {
          return null;
        }

        return currentColor;
      });
    }, 320);

    timersRef.current.push(removeFlashTimer);
  }

  function playSequence(nextSequence) {
    clearTimers();
    setIsPlayerTurn(false);
    setUserInput([]);
    setActiveColor(null);

    for (let i = 0; i < nextSequence.length; i++) {
      const showColorTimer = setTimeout(function () {
        flashColor(nextSequence[i]);
      }, i * 700);

      timersRef.current.push(showColorTimer);
    }

    const allowPlayerTimer = setTimeout(function () {
      setIsPlayerTurn(true);
    }, nextSequence.length * 700);

    timersRef.current.push(allowPlayerTimer);
  }

  function startGame() {
    getAudioContext();
    clearTimers();
    setSequence([getRandomColor()]);
    setUserInput([]);
    setLevel(1);
    setIsStarted(true);
    setIsGameOver(false);
    setIsPlayerTurn(false);
    setActiveColor(null);
  }

  function handleGameOver() {
    clearTimers();
    setIsGameOver(true);
    setIsPlayerTurn(false);
    setActiveColor(null);
    playGameOverSound();
  }

  function handleColorClick(color) {
    if (!isStarted || !isPlayerTurn || isGameOver) {
      return;
    }

    flashColor(color);

    const nextUserInput = [...userInput, color];
    const expectedColor = sequence[nextUserInput.length - 1];

    setUserInput(nextUserInput);

    if (color !== expectedColor) {
      handleGameOver();
      return;
    }

    if (nextUserInput.length === sequence.length) {
      setIsPlayerTurn(false);

      const nextRoundTimer = setTimeout(function () {
        setLevel(function (currentLevel) {
          return currentLevel + 1;
        });

        setSequence(function (currentSequence) {
          return [...currentSequence, getRandomColor()];
        });
      }, 900);

      timersRef.current.push(nextRoundTimer);
    }
  }

  let statusTitle = "Ready to Start";
  let statusMessage = "Press Start Game to generate the first random pattern.";

  if (isStarted && !isPlayerTurn && !isGameOver) {
    statusTitle = "Watch Carefully";
    statusMessage = "Observe the button sequence and remember the pattern.";
  }

  if (isStarted && isPlayerTurn && !isGameOver) {
    statusTitle = "Your Turn";
    statusMessage = "Repeat the same color order by clicking the buttons.";
  }

  if (isGameOver) {
    statusTitle = "Game Over";
    statusMessage = "You clicked the wrong color. Press Start Game to try again.";
  }

  let buttonLabel = "Start Game";

  if (isStarted && !isGameOver) {
    buttonLabel = "Restart Game";
  }

  if (isGameOver) {
    buttonLabel = "Play Again";
  }

  return (
    <main className="game-container">
      <p className="game-subtitle">React + Vite Simon Game</p>
      <h1 className="game-title">Simon Game</h1>

      <ScoreBoard
        level={level}
        patternLength={sequence.length}
        statusTitle={statusTitle}
        statusMessage={statusMessage}
        isGameOver={isGameOver}
      />

      <ButtonGrid
        colors={colors}
        activeColor={activeColor}
        disabled={!isStarted || !isPlayerTurn || isGameOver}
        onColorClick={handleColorClick}
      />

      <button className="start-button" type="button" onClick={startGame}>
        {buttonLabel}
      </button>
    </main>
  );
}

export default App;
