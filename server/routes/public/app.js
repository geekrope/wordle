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
const wrapperId = "wrapper";
const alertsContainerId = "alerts";
const statisticsOpenButtonId = "statisticsOpen";
let pickedWordIndex = "";
var letterType;
(function (letterType) {
    letterType[letterType["correct"] = 2] = "correct";
    letterType[letterType["present"] = 1] = "present";
    letterType[letterType["absent"] = 0] = "absent";
})(letterType || (letterType = {}));
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
    { content: undefined, code: 86 },
    { content: undefined, code: 66 },
    { content: undefined, code: 78 },
    { content: undefined, code: 77 },
    { content: "@/backspace.svg", code: 8, flex: 1.5 }
];
let keyboardMap = new Map();
let keysLocked = false;
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
function getRowId(index) {
    return "row_" + index;
}
function getRow(index) {
    return document.getElementById(getRowId(index));
}
function createRow(row) {
    const container = document.createElement("div");
    container.className = "flex rowContainer";
    container.style.width = "calc(var(--size) * 330)";
    container.id = getRowId(row);
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
        const rowElement = createRow(row);
        rowElement.id = getRowId(row);
        container.appendChild(rowElement);
    }
    return container;
}
function createAlert(text) {
    const alert = document.createElement("div");
    alert.className = "alertBox";
    alert.innerText = text;
    const animation = alert.animate([
        { opacity: 1, offset: 0 },
        { opacity: 1, offset: 0.7 },
        { opacity: 0, offset: 1, easing: "cubic-bezier(0.645, 0.045, 0.355, 1)" }
    ], { duration: 1000 });
    animation.onfinish = () => {
        alert.remove();
    };
    return alert;
}
function shakeCurrentRow() {
    const row = getRow(currentRow);
    if (row) {
        row.animate([
            { transform: "translateX(-1px)", offset: 0.1 },
            { transform: "translateX(2px)", offset: 0.2 },
            { transform: "translateX(-4px)", offset: 0.3 },
            { transform: "translateX(4px)", offset: 0.4 },
            { transform: "translateX(-4px)", offset: 0.5 },
            { transform: "translateX(4px)", offset: 0.6 },
            { transform: "translateX(-4px)", offset: 0.7 },
            { transform: "translateX(2px)", offset: 0.8 },
            { transform: "translateX(-1px)", offset: 0.9 }
        ], 600);
    }
}
function createKey(content, action) {
    const container = document.createElement("div");
    container.className = "innerCentralAlign keyStyle";
    if (content[0] == "@") {
        container.innerHTML = `<img src="${content.substring(1)}"></img>`;
    }
    else {
        container.innerText = content;
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
    container.style.paddingBottom = "10px";
    container.appendChild(createKeyboardRow(keyboardRow1));
    container.appendChild(createKeyboardRow(keyboardRow2));
    container.appendChild(createKeyboardRow(keyboardRow3));
    return container;
}
function createBlankStatistics() {
    return { correctAnswers: 0, totalAnswers: 0, guessesDistribution: new Array(rowsCount).fill(0), currentStreak: 0, maxStreak: 0 };
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
function createGuessDistributionItem(item, value, maxValue, color, width) {
    const element = document.createElement("div");
    const itemElement = document.createElement("div");
    const valueElement = document.createElement("div");
    itemElement.className = "statisticsText";
    itemElement.innerText = item.toString();
    itemElement.style.marginRight = "4px";
    valueElement.className = "statisticsText rowContainer guessDistributionValue";
    valueElement.innerText = value.toString();
    valueElement.style.width = `max(${value / maxValue * 100}%, 16px)`;
    valueElement.style.background = color;
    valueElement.style.display = "flex";
    valueElement.style.color = "#fff";
    valueElement.style.paddingRight = "8px";
    element.className = "rowContainer";
    element.style.width = width;
    element.appendChild(itemElement);
    element.appendChild(valueElement);
    element.style.display = "flex";
    return element;
}
function createGuessDistribution(stats) {
    const element = document.createElement("div");
    const maxValue = Math.max.apply(null, stats.guessesDistribution);
    element.className = "columnContainer";
    element.style.display = "flex";
    stats.guessesDistribution.forEach((value, index) => {
        const guessDistributionItem = createGuessDistributionItem(index + 1, value, maxValue, "rgb(120, 124, 126)", "100%");
        guessDistributionItem.style.paddingBottom = "4px";
        element.appendChild(guessDistributionItem);
    });
    return element;
}
function createStatisticsHeader(content) {
    const element = document.createElement("h1");
    element.textContent = content;
    element.className = "statisticsText";
    element.style.fontSize = "16px";
    element.style.fontWeight = "700";
    return element;
}
function createStatisticsContentBlock(title, content) {
    const element = document.createElement("div");
    const header = createStatisticsHeader(title);
    header.style.width = "100%";
    header.style.textAlign = "center";
    content.style.margin = "0 auto 0 auto";
    element.className = "columnContainer";
    element.style.display = "flex";
    element.style.width = "100%";
    element.appendChild(header);
    element.appendChild(content);
    return element;
}
function createCloseButton(container) {
    const closeButton = document.createElement("img");
    closeButton.src = "close.svg";
    closeButton.className = "buttonIcon";
    closeButton.style.position = "absolute";
    closeButton.style.right = "16px";
    closeButton.style.top = "16px";
    closeButton.onclick = () => { container.remove(); };
    return closeButton;
}
function createStatisticsParameter(name, value) {
    const element = document.createElement("div");
    const header = document.createElement("div");
    const parameter = document.createElement("div");
    element.className = "columnContainer";
    element.style.display = "flex";
    element.style.flex = "1";
    header.className = "statisticsText";
    header.innerText = name;
    header.style.textAlign = "center";
    parameter.className = "statisticsText";
    parameter.innerText = value.toString();
    parameter.style.textAlign = "center";
    parameter.style.fontWeight = "400";
    parameter.style.fontSize = "36px";
    element.appendChild(parameter);
    element.appendChild(header);
    return element;
}
function createStatisticsEvaluations(stats) {
    const element = document.createElement("div");
    element.className = "rowContainer";
    element.style.display = "flex";
    element.style.width = "max(50%, 200px)";
    element.appendChild(createStatisticsParameter("Played", stats.totalAnswers));
    element.appendChild(createStatisticsParameter("Win %", stats.totalAnswers == 0 ? 0 : Math.round(stats.correctAnswers / stats.totalAnswers * 100)));
    element.appendChild(createStatisticsParameter("Current streak", stats.currentStreak));
    element.appendChild(createStatisticsParameter("Max streak", stats.maxStreak));
    return element;
}
function createStatisticsBox(stats, container) {
    const element = document.createElement("div");
    element.className = "flex columnContainer statisticsContainer";
    element.style.position = "relative";
    const guessDistribution = createGuessDistribution(stats);
    guessDistribution.style.width = "80%";
    const statisticsBlock = createStatisticsContentBlock("STATISTICS", createStatisticsEvaluations(stats));
    statisticsBlock.style.marginTop = "24px";
    element.appendChild(statisticsBlock);
    if (stats.totalAnswers != 0) {
        element.appendChild(createStatisticsContentBlock("GUESS DISTRIBUTION", guessDistribution));
    }
    element.appendChild(createCloseButton(container));
    return element;
}
function createStatisticsOverlay() {
    const element = document.createElement("div");
    element.className = "overlay";
    element.appendChild(createStatisticsBox(getStatistics(), element));
    return element;
}
function getCurrentWord() {
    let word = "";
    for (let index = 0; index < lettersCount; index++) {
        const letterElement = getLetter(index, currentRow);
        if (letterElement) {
            word += letterElement.innerText;
        }
    }
    return word;
}
function winHandler() {
    window.alert("Bingo");
    let userStats = getStatistics();
    userStats.correctAnswers++;
    userStats.totalAnswers++;
    userStats.guessesDistribution[currentRow]++;
    userStats.currentStreak++;
    userStats.maxStreak = userStats.currentStreak > userStats.maxStreak ? userStats.currentStreak : userStats.maxStreak;
    setStatistics(userStats);
    keysLocked = true;
}
function loseHandler() {
    window.alert("Loss");
    let userStats = getStatistics();
    userStats.totalAnswers++;
    userStats.currentStreak = 0;
    setStatistics(userStats);
    keysLocked = true;
}
function checkCurrentRow() {
    return __awaiter(this, void 0, void 0, function* () {
        keysLocked = true;
        const word = getCurrentWord();
        const text = yield (yield fetch(`/guess?word=${word}&comparisonParams={"pickedWordIndex":${pickedWordIndex}}`, { method: "POST" })).text();
        try {
            const specifiedWord = JSON.parse(text);
            let correctLetters = 0;
            specifiedWord.forEach((value, index) => {
                setSpecifiedLetterStyle(index, currentRow, value.type);
                setKeyboardLetterStyle(toUpper(value._charCode), value.type);
                if (value.type == letterType.correct) {
                    correctLetters++;
                }
            });
            keysLocked = false;
            return correctLetters == lettersCount;
        }
        catch (_a) {
            keysLocked = false;
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
            case letterType.correct:
                letterElement.className = "innerCentralAlign letterContainer specifiedLetter specifiedCorrect";
                break;
            case letterType.present:
                letterElement.className = "innerCentralAlign letterContainer specifiedLetter specifiedPresent";
                break;
            case letterType.absent:
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
    if (((keyboardMap.has(code) && keyboardMap.get(code) < type) || !keyboardMap.has(code)) && key) {
        switch (type) {
            case letterType.correct:
                key.style.background = "var(--background-specified-correct)";
                break;
            case letterType.present:
                key.style.background = "var(--background-specified-present)";
                break;
            case letterType.absent:
                key.style.background = "var(--background-specified-absent)";
                break;
            default:
                throw new Error("Unknown letter type");
        }
        keyboardMap.set(code, type);
    }
}
function keyHandler(charCode) {
    if (!keysLocked) {
        const char = String.fromCharCode(charCode);
        const letterElement = getLetter(currentColumn, currentRow);
        if (alphabet.test(char) && currentColumn < lettersCount && letterElement) {
            letterElement.innerText = char;
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
                    shakeCurrentRow();
                }
            });
        }
        else if (charCode == 8 && currentColumn - 1 >= 0) {
            const editedElement = getLetter(currentColumn - 1, currentRow);
            if (editedElement) {
                editedElement.innerText = "";
                setUnselectedLetterStyle(editedElement);
                currentColumn--;
            }
        }
    }
}
function decodeQuery(search) {
    if (search[0] == "?") {
        search = search.substring(1);
    }
    const splittedParameters = search.split("&").filter(element => element);
    ;
    const result = {};
    splittedParameters.forEach((parameter) => {
        const equalSignIndex = parameter.indexOf("=");
        const name = parameter.substring(0, equalSignIndex);
        const value = parameter.substring(equalSignIndex + 1);
        result[name] = value;
    });
    return result;
}
window.addEventListener("load", () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const wrapper = document.getElementById(wrapperId);
    if (wrapper) {
        wrapper.appendChild(createBoard());
        wrapper.appendChild(createKeyboard());
    }
    const urlParams = decodeQuery(window.location.search);
    const type = urlParams["type"];
    fetch(`/pick?type=${type ? type : "daily"}`).then((fulfilled) => __awaiter(void 0, void 0, void 0, function* () {
        if (fulfilled.ok) {
            pickedWordIndex = yield fulfilled.text();
        }
        else {
            pickedWordIndex = yield (yield fetch(`/pick?type=daily`)).text();
        }
    }));
    (_a = document.getElementById(statisticsOpenButtonId)) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => { document.body.appendChild(createStatisticsOverlay()); });
}));
window.addEventListener("keydown", (event) => {
    keyHandler(event.keyCode);
});
window.alert = (message) => {
    const alertsContainer = document.getElementById(alertsContainerId);
    if (alertsContainer) {
        alertsContainer.insertBefore(createAlert(message), alertsContainer.firstChild);
    }
};
