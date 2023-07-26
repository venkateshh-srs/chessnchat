import React from "react";
import "./message.css";
function Message(props) {
  const splitArray = props.data.message.split(":");
  const username = splitArray[0];
  const message = splitArray[1];
  const time=props.data.time;

// Create random color in CSS format (rgb(r, g, b))

  // console.log(username);
  // console.log(props);
  return (
    <>
      <div className="card">
        <div className="name">{username}</div>
        <div className="message">{message}</div>
        <div className="time">{`${time}`} </div>
      </div>
    </>
  );
}

export default Message;
