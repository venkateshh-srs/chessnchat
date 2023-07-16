import { useRef } from "react";
import styles from "./Board.module.css";

//topLH->top left edge of the div(horizontal distance from top left edge of view port)

const YourComponent = ({ type, boundingRect, onDragAndDrop }) => {
  let left, top, right, bottom, width;
  if (boundingRect !== null) {
    left = boundingRect.left;
    top = boundingRect.top;
    right = boundingRect.right;
    bottom = boundingRect.bottom;
    width = boundingRect.width;
  }
  const divRef = useRef(null);
  let initialX = 0;
  let initialY = 0;
  let isDragging = false;
  let boundedLeft = 0;
  let boundedTop = 0;
  let i, j;
  const handleMouseDown = (event) => {
    if (divRef.current === null) return;

    event.preventDefault();
    let cellWidth = width / 8;

    i = Math.min(
      7,
      Math.max(0, Math.floor((event.clientX - left) / cellWidth))
    );

    j = Math.min(7, Math.max(0, Math.floor((event.clientY - top) / cellWidth)));
    const rect = divRef.current.getBoundingClientRect();
    initialX = rect.left + (rect.right - rect.left) / 2;
    initialY = rect.top + (rect.bottom - rect.top) / 2;

    isDragging = true;
    divRef.current.style.cursor = "grabbing";
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (event) => {
    if (divRef.current === null) return;

    if (isDragging) {
      // console.log(event.clientX);
      // console.log(topLVD);

      const dx = event.clientX - initialX;
      const dy = event.clientY - initialY;

      // Calculate the boundaries
      const maxLeft = initialX - left;
      const maxTop = initialY - top;
    divRef.current.style.cursor = "grabbing";

      // Restrict movement within the boundaries
      boundedLeft = Math.min(Math.max(-maxLeft, dx), right - initialX);
      boundedTop = Math.min(Math.max(-maxTop, dy), bottom - initialY);
      divRef.current.style.transform = `translate(${boundedLeft}px, ${boundedTop}px)`;
      // console.log(maxLeft);
    }
  };

  const handleMouseUp = (event) => {
    if (divRef.current === null) return;

    if (isDragging) {
      let cellWidth = width / 8;
      let x = Math.min(
        7,
        Math.max(0, Math.floor((event.clientX - left) / cellWidth))
      );

      let y = Math.min(
        7,
        Math.max(0, Math.floor((event.clientY - top) / cellWidth))
      );

      divRef.current.style.cursor = "grab";

      // divRef.current.style.transform = "translate(0, 0)";

      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      onDragAndDrop(
        { source: `${j}-${i}`, target: `${y}-${x}` },
        divRef,
        sessionStorage.getItem("isUserTakenWhiteOrBlack")
      );
      isDragging = false;
      // if(board[j][i]==="")

      // Perform any additional actions with finalX and finalY
    }
  };

  const styless={
     backgroundImage: `url("assets/${type}.png")`,
  }
  let sty=(type!=="")?styless:null;
  // console.log(sty);
  return (
    <div
      ref={divRef}
      style={sty}
      className={sty!==null?styles.png:null}
      onMouseDown={handleMouseDown}
    ></div>
  );
};

export default YourComponent;
