"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const lettersCount = 5;
const rowsCount = 6;
const animationDelay = 0.2;
const alphabet = /^[A-Za-z0-9]*$/;
const statisticsId = "statistics";
const guessesId = "guesses";
const keyboardRow1 = [
    { content: undefined, code: 81 },
    { content: undefined, code: 87 },
    { content: undefined, code: 69 },
    { content: undefined, code: 82 },
    { content: undefined, code: 84 },
    { content: undefined, code: 89 },
    { content: undefined, code: 85 },
    { content: undefined, code: 73 },
    { content: undefined, code: 79 },
    { content: undefined, code: 80 }
];
const keyboardRow2 = [
    { content: undefined, code: 65 },
    { content: undefined, code: 83 },
    { content: undefined, code: 68 },
    { content: undefined, code: 70 },
    { content: undefined, code: 71 },
    { content: undefined, code: 72 },
    { content: undefined, code: 74 },
    { content: undefined, code: 75 },
    { content: undefined, code: 76 }
];
const keyboardRow3 = [
    { content: "ENTER", code: 13, flex: 1.5 },
    { content: undefined, code: 90 },
    { content: undefined, code: 88 },
    { content: undefined, code: 67 },
    { content: undefined, code: 68 },
    { content: undefined, code: 66 },
    { content: undefined, code: 78 },
    { content: undefined, code: 77 },
    { content: "@/backspace.svg", code: 8, flex: 1.5 }
];
let currentRow = 0;
let currentColumn = 0;
function toUpper(code) {
    return String.fromCharCode(code).toUpperCase().charCodeAt(0);
}
function getLetterId(column, row) {
    return "letter" + column + "_" + row;
}
function getLetter(column, row) {
    return document.getElementById(getLetterId(column, row));
}
function getKeyId(code) {
    return "key_" + code;
}
function getKey(code) {
    return document.getElementById(getKeyId(code));
}
function createRow(row) {
    const container = document.createElement("div");
    container.className = "flex rowContainer";
    container.style.width = "calc(var(--size) * 330)";
    for (let column = 0; column < lettersCount; column++) {
        const letterContainer = document.createElement("div");
        letterContainer.className = "innerCentralAlign letterContainer unspecifiedLetter";
        letterContainer.id = getLetterId(column, row);
        container.appendChild(letterContainer);
    }
    return container;
}
function createBoard() {
    const container = document.createElement("div");
    container.className = "flex columnContainer";
    container.style.height = "calc(var(--size) * 400)";
    for (let row = 0; row < rowsCount; row++) {
        container.appendChild(createRow(row));
    }
    return container;
}
function createBlankStatistics() {
    return { correctAnswers: 0, totalAnswers: 0, guessesDistribution: new Array(rowsCount).fill(0), currentStreak: 0, maxStreak: 0 };
}
function createKey(content, action) {
    const container = document.createElement("div");
    container.className = "innerCentralAlign keyStyle";
    if (content[0] == "@") {
        container.innerHTML = `<img src="${content.substring(1)}"></img>`;
    }
    else {
        container.innerHTML = content;
    }
    container.onclick = action;
    return container;
}
function createKeyboardRow(row) {
    const container = document.createElement("div");
    container.className = "rowContainer";
    container.style.display = "flex";
    container.style.justifyContent = "center";
    container.style.width = "calc(var(--key-size)*484)";
    container.style.padding = "0 calc(var(--key-size)*8) 0 calc(var(--key-size)*8)";
    row.forEach((value, index) => {
        const key = createKey(value.content ? value.content : String.fromCharCode(value.code), () => { keyHandler(value.code); });
        if (index < row.length - 1) {
            key.style.marginRight = "calc(var(--size) * 6)";
        }
        if (value.flex) {
            key.style.flex = value.flex.toString();
        }
        key.id = getKeyId(value.code);
        container.appendChild(key);
    });
    return container;
}
function createKeyboard() {
    const container = document.createElement("div");
    container.className = "flex columnContainer";
    container.style.height = "200px";
    container.appendChild(createKeyboardRow(keyboardRow1));
    container.appendChild(createKeyboardRow(keyboardRow2));
    container.appendChild(createKeyboardRow(keyboardRow3));
    return container;
}
function getStatistics() {
    const stats = localStorage.getItem(statisticsId);
    if (stats) {
        return JSON.parse(stats);
    }
    else {
        const blank = createBlankStatistics();
        setStatistics(blank);
        return blank;
    }
}
function setStatistics(stats) {
    localStorage.setItem(statisticsId, JSON.stringify(stats));
}
function getCurrentWord() {
    let word = "";
    for (let index = 0; index < lettersCount; index++) {
        const letterElement = getLetter(index, currentRow);
        if (letterElement) {
            word += letterElement.innerHTML;
        }
    }
    return word;
}
function winHandler() {
    alert("biungo");
    let userStats = getStatistics();
    userStats.correctAnswers++;
    userStats.totalAnswers++;
    userStats.guessesDistribution[currentRow]++;
    userStats.currentStreak++;
    userStats.maxStreak = userStats.currentStreak > userStats.maxStreak ? userStats.currentStreak : userStats.maxStreak;
    setStatistics(userStats);
}
function loseHandler() {
    alert("jsdngiksdkg");
    let userStats = getStatistics();
    userStats.totalAnswers++;
    userStats.currentStreak = 0;
    setStatistics(userStats);
}
function checkCurrentRow() {
    return __awaiter(this, void 0, void 0, function* () {
        const word = getCurrentWord();
        const text = yield (yield fetch(`/guess?word=${word}`, { method: "POST" })).text();
        try {
            const specifiedWord = JSON.parse(text);
            let correctLetters = 0;
            specifiedWord.forEach((value, index) => {
                setSpecifiedLetterStyle(index, currentRow, value.type);
                setKeyboardLetterStyle(toUpper(value._charCode), value.type);
                if (value.type == "correct") {
                    correctLetters++;
                }
            });
            return correctLetters == lettersCount;
        }
        catch (_a) {
            return text;
        }
    });
}
function setSelectedLetterStyle(letterElement) {
    letterElement.animate([
        { transform: "scale(1)" },
        { transform: "scale(1.1)" },
        { transform: "scale(1)" },
    ], {
        duration: 100,
        iterations: 1
    });
    letterElement.style.borderColor = "var(--border-selected-unspecified)";
}
function setUnselectedLetterStyle(letterElement) {
    letterElement.style.borderColor = "var(--border-unspecified)";
}
function setSpecifiedLetterStyle(index, row, type) {
    const letterElement = getLetter(index, row);
    if (letterElement) {
        switch (type) {
            case "correct":
                letterElement.className = "innerCentralAlign letterContainer specifiedLetter specifiedCorrect";
                break;
            case "present":
                letterElement.className = "innerCentralAlign letterContainer specifiedLetter specifiedPresent";
                break;
            case "absent":
                letterElement.className = "innerCentralAlign letterContainer specifiedLetter specifiedAbsent";
                break;
            default:
                throw new Error("Unknown letter type");
        }
        letterElement.style.animationDelay = index * animationDelay + "s";
    }
}
function setKeyboardLetterStyle(code, type) {
    const key = getKey(code);
    if (key) {
        switch (type) {
            case "correct":
                key.style.background = "var(--background-specified-correct)";
                break;
            case "present":
                key.style.background = "var(--background-specified-present)";
                break;
            case "absent":
                key.style.background = "var(--background-specified-absent)";
                break;
            default:
                throw new Error("Unknown letter type");
        }
    }
}
function keyHandler(charCode) {
    const char = String.fromCharCode(charCode);
    const letterElement = getLetter(currentColumn, currentRow);
    if (alphabet.test(char) && currentColumn < lettersCount && letterElement) {
        letterElement.innerHTML = char;
        currentColumn++;
        setSelectedLetterStyle(letterElement);
    }
    else if (charCode == 13) {
        const win = checkCurrentRow();
        win.then((value) => {
            if (typeof value == "boolean") {
                if (value) {
                    winHandler();
                }
                else if (currentRow + 1 >= rowsCount) {
                    loseHandler();
                }
                else {
                    currentColumn = 0;
                    currentRow++;
                }
            }
            else {
                window.alert(value);
            }
        });
    }
    else if (charCode == 8 && currentColumn - 1 > -1) {
        const editedElement = getLetter(currentColumn - 1, currentRow);
        if (editedElement) {
            editedElement.innerHTML = "";
            setUnselectedLetterStyle(editedElement);
            currentColumn--;
        }
    }
}
window.addEventListener("load", () => {
    document.body.appendChild(createBoard());
    document.body.appendChild(createKeyboard());
});
window.addEventListener("keydown", (event) => {
    keyHandler(event.keyCode);
});
