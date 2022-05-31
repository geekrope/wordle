"use strict";
const lettersCount = 5;
const rowsCount = 6;
const animationDelay = 0.2;
const alphabet = /^[A-Za-z0-9]*$/;
let currentRow = 0;
let currentColumn = 0;
function getLetterId(column, row) {
    return "letter" + column + "_" + row;
}
function getLetter(column, row) {
    return document.getElementById(getLetterId(column, row));
}
function createRow(row) {
    const container = document.createElement("div");
    container.className = "flex rowContainer";
    for (let column = 0; column < lettersCount; column++) {
        const letterContainer = document.createElement("div");
        letterContainer.className = "letterContainer unspecifiedLetter";
        letterContainer.id = getLetterId(column, row);
        container.appendChild(letterContainer);
    }
    return container;
}
function createBoard() {
    const container = document.createElement("div");
    container.className = "flex columnContainer";
    for (let row = 0; row < rowsCount; row++) {
        container.appendChild(createRow(row));
    }
    return container;
}
function submitCurrentRow() {
    let word = "";
    for (let index = 0; index < lettersCount; index++) {
        const letterElement = getLetter(index, currentRow);
        if (letterElement) {
            word += letterElement.innerHTML;
        }
    }
    console.log(word);
    const response = fetch(`/guess?word=${word}`, { method: "POST" });
    response.then((response) => {
        response.text().then((text) => {
            try {
                const specifiedWord = JSON.parse(text);
                specifiedWord.forEach((value, index) => {
                    const letterElement = getLetter(index, currentRow);
                    if (letterElement) {
                        switch (value.type) {
                            case "correct":
                                letterElement.className = "letterContainer specifiedLetter specifiedCorrect";
                                break;
                            case "present":
                                letterElement.className = "letterContainer specifiedLetter specifiedPresent";
                                break;
                            case "absent":
                                letterElement.className = "letterContainer specifiedLetter specifiedAbsent";
                                break;
                            default:
                                throw new Error("Unknown letter type");
                        }
                        letterElement.style.animationDelay = index * animationDelay + "s";
                    }
                });
                currentColumn = 0;
                currentRow++;
            }
            catch (_a) {
                window.alert(text);
            }
        });
    });
}
window.addEventListener("load", () => {
    document.body.appendChild(createBoard());
});
window.addEventListener("keydown", (event) => {
    const char = String.fromCharCode(event.keyCode);
    const letterElement = getLetter(currentColumn, currentRow);
    if (alphabet.test(char) && letterElement && (currentColumn != lettersCount - 1 || letterElement.innerHTML.length == 0)) {
        letterElement.innerHTML = char;
        currentColumn = Math.min(currentColumn + 1, lettersCount - 1);
    }
    else if (event.keyCode == 13) //enter
     {
        submitCurrentRow();
    }
    else if (event.keyCode == 8 && currentColumn - 1 >= 0 && letterElement && letterElement.innerHTML.length == 0) //backspace
     {
        const editedElement = getLetter(currentColumn - 1, currentRow);
        if (editedElement) {
            editedElement.innerHTML = "";
        }
        currentColumn--;
    }
    else if (event.keyCode == 8 && letterElement) {
        letterElement.innerHTML = "";
    }
});
//# sourceMappingURL=app.js.map