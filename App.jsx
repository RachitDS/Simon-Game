import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
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
  const [highScore, setHighScore] = useState(function () {
    const savedHighScore = window.localStorage.getItem("simon-high-score");

    if (!savedHighScore) {
      return 0;
    }

    return Number(savedHighScore);
  });
  const [isStarted, setIsStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [activeColor, setActiveColor] = useState(null);

  const timersRef = useRef([]);
  const audioContextRef = useRef(null);
  const containerRef = useRef(null);
  const statusCardRef = useRef(null);
  const buttonRefs = useRef([]);
  const backgroundRefs = useRef([]);
  const headerRef = useRef(null);
  const subtitleRef = useRef(null);
  const startButtonRef = useRef(null);
  const sequenceRef = useRef([]);
  const userInputRef = useRef([]);

  useEffect(() => {
    if (!isStarted || sequence.length === 0 || isGameOver) {
      return;
    }

    playSequence(sequence);
  }, [sequence, isStarted, isGameOver]);

  useEffect(() => {
    sequenceRef.current = sequence;
  }, [sequence]);

  useEffect(() => {
    userInputRef.current = userInput;
  }, [userInput]);

  useEffect(() => {
    if (!isGameOver) {
      const animatedItems = [
        containerRef.current,
        statusCardRef.current,
        ...buttonRefs.current.filter(Boolean)
      ];

      gsap.set(animatedItems, { clearProps: "all" });
      return;
    }

    const buttons = buttonRefs.current.filter(Boolean);
    const defeatTimeline = gsap.timeline();

    defeatTimeline
      .to(containerRef.current, {
        x: -14,
        duration: 0.08,
        repeat: 5,
        yoyo: true,
        ease: "power1.inOut"
      })
      .to(
        statusCardRef.current,
        {
          scale: 1.04,
          backgroundColor: "#fecaca",
          borderColor: "#dc2626",
          duration: 0.2,
          yoyo: true,
          repeat: 1,
          ease: "power1.out"
        },
        0
      )
      .to(
        buttons,
        {
          scale: 0.92,
          rotation: function (index) {
            return index % 2 === 0 ? -5 : 5;
          },
          duration: 0.18,
          yoyo: true,
          repeat: 1,
          stagger: 0.04,
          ease: "power1.out"
        },
        0
      );

    return () => {
      defeatTimeline.kill();
    };
  }, [isGameOver]);

  useEffect(() => {
    if (level > highScore) {
      setHighScore(level);
      window.localStorage.setItem("simon-high-score", String(level));
    }
  }, [level, highScore]);

  useEffect(() => {
    const backgroundTweens = backgroundRefs.current
      .filter(Boolean)
      .map(function (element, index) {
        const positions = [
          { x: 34, y: -26, scale: 1.08, rotation: 8, duration: 18 },
          { x: -42, y: 24, scale: 1.12, rotation: -10, duration: 22 },
          { x: 26, y: 36, scale: 1.07, rotation: 12, duration: 20 },
          { x: -20, y: -28, scale: 1.05, rotation: -8, duration: 16 },
          { x: 18, y: 22, scale: 1.06, rotation: 6, duration: 24 }
        ];

        const animation = positions[index] || positions[0];

        return gsap.to(element, {
          x: animation.x,
          y: animation.y,
          scale: animation.scale,
          rotation: animation.rotation,
          duration: animation.duration,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      });

    return () => {
      backgroundTweens.forEach(function (tween) {
        tween.kill();
      });
    };
  }, []);

  useEffect(() => {
    if (isStarted) {
      return;
    }

    const introTimeline = gsap.timeline();

    introTimeline
      .fromTo(
        containerRef.current,
        { autoAlpha: 0, y: 32, scale: 0.96 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "power2.out" }
      )
      .fromTo(
        subtitleRef.current,
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.28, ease: "power2.out" },
        "-=0.28"
      )
      .fromTo(
        headerRef.current,
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.36, ease: "power2.out" },
        "-=0.2"
      )
      .fromTo(
        statusCardRef.current,
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" },
        "-=0.14"
      )
      .fromTo(
        buttonRefs.current.filter(Boolean),
        { autoAlpha: 0, y: 22, scale: 0.92 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.28,
          stagger: 0.06,
          ease: "back.out(1.6)"
        },
        "-=0.12"
      )
      .fromTo(
        startButtonRef.current,
        { autoAlpha: 0, y: 16, scale: 0.95 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.28, ease: "power2.out" },
        "-=0.1"
      );

    return () => {
      introTimeline.kill();
    };
  }, [isStarted]);

  useEffect(() => {
    function handleKeyDown(event) {
      const pressedKey = event.key.toLowerCase();

      if (!isStarted && (pressedKey === "enter" || pressedKey === " ")) {
        event.preventDefault();
        startGame();
        return;
      }

      const keyMap = {
        "1": "red",
        r: "red",
        "2": "green",
        g: "green",
        "3": "blue",
        b: "blue",
        "4": "yellow",
        y: "yellow"
      };

      const selectedColor = keyMap[pressedKey];

      if (!selectedColor) {
        return;
      }

      event.preventDefault();
      handlePlayerInput(selectedColor);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isStarted, isPlayerTurn, isGameOver, sequence, userInput]);

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
    userInputRef.current = [];
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
    sequenceRef.current = [];
    setUserInput([]);
    userInputRef.current = [];
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

  function handlePlayerInput(color) {
    if (!isStarted || !isPlayerTurn || isGameOver) {
      return;
    }

    flashColor(color);

    const nextUserInput = [...userInputRef.current, color];
    const expectedColor = sequenceRef.current[nextUserInput.length - 1];

    setUserInput(nextUserInput);
    userInputRef.current = nextUserInput;

    if (color !== expectedColor) {
      handleGameOver();
      return;
    }

    if (nextUserInput.length === sequenceRef.current.length) {
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
    statusMessage =
      "Repeat the same color order by clicking the buttons or using R, G, B, Y.";
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
    <div className="app-scene">
      <div
        ref={function (element) {
          backgroundRefs.current[0] = element;
        }}
        className="background-orb orb-one"
      />
      <div
        ref={function (element) {
          backgroundRefs.current[1] = element;
        }}
        className="background-orb orb-two"
      />
      <div
        ref={function (element) {
          backgroundRefs.current[2] = element;
        }}
        className="background-orb orb-three"
      />
      <div
        ref={function (element) {
          backgroundRefs.current[3] = element;
        }}
        className="background-orb orb-four"
      />
      <div
        ref={function (element) {
          backgroundRefs.current[4] = element;
        }}
        className="background-orb orb-five"
      />

      <main ref={containerRef} className="game-container">
        <p ref={subtitleRef} className="game-subtitle">
          React + Vite Simon Game
        </p>
        <h1 ref={headerRef} className="game-title">
          Simon Game
        </h1>

        <ScoreBoard
          level={level}
          highScore={highScore}
          patternLength={sequence.length}
          statusTitle={statusTitle}
          statusMessage={statusMessage}
          isGameOver={isGameOver}
          statusCardRef={statusCardRef}
        />

        <ButtonGrid
          colors={colors}
          activeColor={activeColor}
          disabled={!isStarted || !isPlayerTurn || isGameOver}
          onColorClick={handlePlayerInput}
          buttonRefs={buttonRefs}
        />

        <button
          ref={startButtonRef}
          className="start-button"
          type="button"
          onClick={startGame}
        >
          {buttonLabel}
        </button>

        <p className="keyboard-hint">
          Keyboard: <span>R</span> Red, <span>G</span> Green, <span>B</span>{" "}
          Blue, <span>Y</span> Yellow
        </p>
      </main>
    </div>
  );
}

export default App;
