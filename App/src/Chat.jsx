import React, { useRef, useEffect, useState } from "react";
import styles from "./Chat.module.css";
import messageSentSound from "../public/assets/msgSent.mp3";
import messageRecivedSound from "../public/assets/msgRecived.mp3";
import Message from "./Message";

function Chat(props) {
  const socket = props.socket;
  const userID = props.userID;
  // console.log(userID);
  const [userChat, setUserChat] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [userTyping, setUserTyping] = useState({ t: false, userName: "" });
  const [onlineUsersVisible, setOnlineUsersVisible] = useState(false);
  const chatContainerRef = useRef(null);
  const btnRef = useRef(null); // Ref for the button
  const [timeOut, setTimeOutId] = useState(null);
  const clickSound = new Audio(messageSentSound);
  const recivedSound = new Audio(messageRecivedSound);

  useEffect(() => {
    // Scroll to the end of the chat container when userChat updates
    scrollToBottom();
  }, [userChat]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  };

  socket.on("chat", (data) => {
    setUserChat(data);
  });

  socket.on("onlineUsers", (data) => {
    setOnlineUsers(data);
  });

  const formattedChat = userChat.map((message, index) => (
    <div key={index}>
      <Message data={message} />
    </div>
  ));
  const formattedOnlineUsers = onlineUsers.map((msg, ind) => {
    // console.log(msg);
    return (
      <div key={ind}>
        {msg.userName + `${msg.isUserTyping ? "(typing)" : ""}`}
      </div>
    );
  });

  const handleClick = (e) => {
    e.preventDefault();
    if (inputValue.length === 0) return;
    // clickSound.play();
    // recivedSound.play();
    setTimeout(() => {
      socket.emit("messageSent", inputValue);
    },400);
    setInputValue("");
  };

  useEffect(() => {
    // Access and modify the button's style using the ref
    if (btnRef.current && inputValue.length > 0) {
      btnRef.current.style.backgroundColor = "#19c37d";
      btnRef.current.style.transition = "0.3s ease-in";
      btnRef.current.style.cursor = "pointer";
    } else {
      btnRef.current.style.backgroundColor = "transparent";
      btnRef.current.style.cursor = "default";
    }
  }, [inputValue]);

  // Add event listeners for keydown and keyup events

  return (
    <>
      <div style={{ border: "0px solid  rgb(255, 0, 144)" }}>
        {onlineUsersVisible && (
          <div
            onClick={() => {
              setOnlineUsersVisible(false);
            }}
            className={styles["online-users-visible"]}
          >
            <h3 className={styles["heading"]}>Online:</h3>
            {formattedOnlineUsers}
          </div>
        )}
        {!onlineUsersVisible && (
          <div
            onClick={() => {
              setOnlineUsersVisible(true);
            }}
            className={styles["online-users-notvisible"]}
          >
            <img   width="30px" src="./assets/eye4.png" alt="" />
          </div>
        )}
        <div className={styles["chat-container"]} ref={chatContainerRef}>
          <div className={styles["message-box"]}>{formattedChat}</div>
        </div>
        <form
          style={{ position: "relative", border: "0px solid green" }}
          onSubmit={handleClick}
          action=""
        >
          <div>
            <input
              className={styles["input"]}
              onChange={(e) => {
                //change input value
                setInputValue(e.target.value);
                //user started typing
                socket.emit("userTyping", { userID, isUserTyping: true });
                //if there is a previous timeout remove it
                if (timeOut) clearTimeout(timeOut);
                //assume user's last letter is typed and set a timeout
                const timeout = setTimeout(() => {
                  socket.emit("userTyping", { userID, isUserTyping: false });
                }, 1000);
                //update the state
                setTimeOutId(timeout);
              }}
              placeholder="Send message"
              value={inputValue}
              type="text"
            />
            <button
              type="submit"
              ref={btnRef} // Assign the ref to the button
              style={{
                border: "0px solid yellow",
                position: "absolute",
                right: "15%",
                top: "45%",

                background: "transparent",
                borderRadius: "15%",
                paddingTop: "1%",
              }}
              className={styles["btn"]}
            >
              <img width="20px" src="./assets/send.png" alt="Submit" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default Chat;
