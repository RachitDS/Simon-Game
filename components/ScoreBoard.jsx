function ScoreBoard({
  level,
  highScore,
  patternLength,
  statusTitle,
  statusMessage,
  isGameOver,
  statusCardRef
}) {
  return (
    <section className="scoreboard">
      <div className="score-card">
        <p className="score-label">Level</p>
        <p className="score-value">{level}</p>
      </div>

      <div className="score-card">
        <p className="score-label">Pattern</p>
        <p className="score-value">{patternLength}</p>
      </div>

      <div className="score-card">
        <p className="score-label">High Score</p>
        <p className="score-value">{highScore}</p>
      </div>

      <div
        ref={statusCardRef}
        className={"status-card" + (isGameOver ? " danger" : "")}
      >
        <p className="status-title">{statusTitle}</p>
        <p className="game-hint">{statusMessage}</p>
      </div>
    </section>
  );
}

export default ScoreBoard;
