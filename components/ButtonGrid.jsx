function ButtonGrid({
  colors,
  activeColor,
  disabled,
  onColorClick,
  buttonRefs
}) {
  return (
    <div className="game-board">
      {colors.map(function (color, index) {
        const isActive = activeColor === color;

        return (
          <button
            key={color}
            type="button"
            className={
              "color-button " + color + (isActive ? " active" : "")
            }
            ref={function (element) {
              buttonRefs.current[index] = element;
            }}
            onClick={function () {
              onColorClick(color);
            }}
            disabled={disabled}
            aria-label={color + " button"}
          >
            {color.charAt(0).toUpperCase() + color.slice(1)}
          </button>
        );
      })}
    </div>
  );
}

export default ButtonGrid;
