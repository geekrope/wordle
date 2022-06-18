"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const fs = require("fs");
const router = express.Router();
var letterType;
(function (letterType) {
    letterType[letterType["correct"] = 2] = "correct";
    letterType[letterType["present"] = 1] = "present";
    letterType[letterType["absent"] = 0] = "absent";
})(letterType || (letterType = {}));
class Letter {
    constructor(charCode, type) {
        this._charCode = charCode;
        this.type = type;
    }
    get char() {
        return String.fromCharCode(this._charCode);
    }
}
class Vocabulary {
    constructor(fileName) {
        this._vocabulary = JSON.parse(fs.readFileSync(fileName, "utf8"));
    }
    get length() {
        return this._vocabulary.length;
    }
    exist(word) {
        return this.getWordIndex(word) >= 0;
    }
    getWordIndex(word) {
        return this._vocabulary.findIndex((value) => { return value.toLowerCase() == word.toLowerCase(); });
    }
    getWordByIndex(index) {
        return this._vocabulary[index];
    }
}
class WordPicker {
    constructor(vocabulary) {
        this._vocabulary = vocabulary;
        this._dailyIndex = this.pickRandomIndex();
    }
    get dailyWord() {
        return this._vocabulary.getWordByIndex(this._dailyIndex);
    }
    get dailyIndex() {
        return this._dailyIndex;
    }
    set dailyIndex(value) {
        if (value >= 0 && value < this._vocabulary.length) {
            this._dailyIndex = value;
        }
    }
    pickRandomIndex() {
        return Math.floor(Math.random() * (this._vocabulary.length - 1));
    }
}
class Comparator {
    constructor(vocabulary) {
        this._vocabulary = vocabulary;
    }
    wordToCharIndices(word) {
        const wordCharIndices = [];
        for (let index = 0; index < word.length; index++) {
            wordCharIndices.push({ index: index, code: word.charCodeAt(index) });
        }
        return wordCharIndices;
    }
    findCorrectLetters(word, correctWord, foundLetters) {
        const letters = foundLetters.slice();
        for (let index = 0; index < correctWord.length && index < word.length;) {
            const guessedChar = word[index];
            const originalChar = correctWord.find((value) => { return value.index == guessedChar.index; });
            if (originalChar && originalChar.code == guessedChar.code) {
                letters[guessedChar.index] = new Letter(guessedChar.code, letterType.correct);
                correctWord.splice(index, 1);
                word.splice(index, 1);
            }
            else {
                index++;
            }
        }
        return letters;
    }
    findPresentLetters(word, correctWord, foundLetters) {
        const letters = foundLetters.slice();
        for (let index = 0; index < correctWord.length && index < word.length;) {
            const guessedChar = word[index];
            const charIndexInWord = correctWord.findIndex((value) => { return value.code == guessedChar.code; });
            if (charIndexInWord >= 0) {
                letters[guessedChar.index] = new Letter(guessedChar.code, letterType.present);
                correctWord.splice(charIndexInWord, 1);
                word.splice(index, 1);
            }
            else {
                index++;
            }
        }
        return letters;
    }
    addRemainingLetters(word, type, foundLetters) {
        const letters = foundLetters.slice();
        for (let index = 0; index < word.length; index++) {
            const guessedChar = word[index];
            letters[guessedChar.index] = new Letter(guessedChar.code, type);
        }
        return letters;
    }
    compare(correctWord, word) {
        word = word.toLowerCase();
        correctWord = correctWord.toLowerCase();
        if (word.length < correctWord.length) {
            return "Not enough letters";
        }
        else if (word.length > correctWord.length) {
            return "Too many letters";
        }
        else if (this._vocabulary.exist(word)) {
            const mappedCorrectWord = this.wordToCharIndices(correctWord);
            const mappedGuessedWord = this.wordToCharIndices(word);
            let letters = new Array(word.length);
            letters = this.findCorrectLetters(mappedGuessedWord, mappedCorrectWord, letters);
            letters = this.findPresentLetters(mappedGuessedWord, mappedCorrectWord, letters);
            letters = this.addRemainingLetters(mappedGuessedWord, letterType.absent, letters);
            return letters;
        }
        else {
            return "Not in word list";
        }
    }
}
const englishVocabulary = new Vocabulary(__dirname + "/vocabulary.json");
const comparator = new Comparator(englishVocabulary);
const wordPicker = new WordPicker(englishVocabulary);
router.post("/guess", (request, response) => {
    const word = request.query["word"];
    const comparisonParams = request.query["comparisonParams"];
    if (word !== undefined && comparisonParams) {
        try {
            const parsedParams = JSON.parse(comparisonParams);
            response.send(comparator.compare(englishVocabulary.getWordByIndex(parsedParams.pickedWordIndex), word)).end();
        }
        catch (_a) {
            response.statusMessage = "Incorrect comparison parameters";
            response.sendStatus(400).end();
        }
    }
    else {
        response.statusMessage = "Missing necessary parameters";
        response.sendStatus(400).end();
    }
});
router.get("/", (_request, response) => {
    response.sendFile(__dirname + "/index.html");
});
router.get("/pick", (request, response) => {
    const type = request.query["type"];
    if (type) {
        switch (type) {
            case "daily":
                response.send(wordPicker.dailyIndex.toString()).end();
                break;
            case "random":
                response.send(wordPicker.pickRandomIndex().toString()).end();
                break;
            default:
                response.statusMessage = "Unknown word type";
                response.sendStatus(400).end();
                break;
        }
    }
    else {
        response.statusMessage = "Missing necessary parameters";
        response.sendStatus(400).end();
    }
});
exports.default = router;
//# sourceMappingURL=index.js.map