import styles from "./Board.module.css";
function Choose(props) {
  const {
    canClickWhiteButton,
    handleWhiteClickButton,
    canClickBlackButton,
    handleBlackClickButton,
    handleRotateClick,
    resetBoard
  } = props;
  if(resetBoard)return(<></>);
  return (
    <>
      <div
        style={{
          border: "0px solid red",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {(canClickBlackButton === true || canClickWhiteButton === true) &&
          sessionStorage.getItem("isUserTakenWhiteOrBlack") && (
            <div
              style={{ color: "#ECEBD6", fontSize: "25px", fontWeight: "bold" }}
            >
              Waiting for opponent...
            </div>
          )}
        {canClickBlackButton === true &&
          canClickWhiteButton === true &&
          sessionStorage.getItem("isUserTakenWhiteOrBlack") && (
            <div
              style={{ color: "#ECEBD6", fontSize: "25px", fontWeight: "bold" }}
            >
              Choose to play:
            </div>
          )}
        {(canClickBlackButton === true ||
          canClickWhiteButton === true) &&
          !sessionStorage.getItem("isUserTakenWhiteOrBlack") && (
            <div
              style={{ color: "#ECEBD6", fontSize: "25px", fontWeight: "bold" }}
            >
              Choose to play:
            </div>
          )}
        <div style={{ border: "0px solid pink" }}>
          <div style={{ display: "inline" }}>
            {canClickWhiteButton &&
              sessionStorage.getItem("isUserTakenWhiteOrBlack") !== "b" && (
                <img
                  src="../assets/k_w.png"
                  alt=""
                  height="50px"
                  width="50px"
                  onClick={handleWhiteClickButton}
                  className={styles.choose}
                />
              )}
          </div>
          <div style={{ display: "inline" }}>
            {canClickBlackButton &&
              sessionStorage.getItem("isUserTakenWhiteOrBlack") !== "w" && (
                <img
                  src="../assets/k_b.png"
                  alt=""
                  height="50px"
                  width="50px"
                  onClick={handleBlackClickButton}
                  className={styles.choose}
                />
              )}
          </div>
         
        </div>
      </div>
    </>
  );
}

export default Choose;
