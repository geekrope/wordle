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
class Comparator {
    constructor(fileName) {
        this.wordLength = 5;
        this._vocabulary = JSON.parse(fs.readFileSync(fileName, "utf8"));
        this._wordIndex = -1;
        this.generateWord();
    }
    get currentWord() {
        return this._vocabulary[this._wordIndex];
    }
    guess(word) {
        word = word.toLowerCase();
        if (word.length < this.wordLength) {
            return "Not enough letters";
        }
        else if (word.length > this.wordLength) {
            return "Too many letters";
        }
        else if (this._vocabulary.includes(word)) {
            const currentWord = [];
            const guessedWord = [];
            const letters = new Array(this.wordLength);
            for (let index = 0; index < this.wordLength; index++) {
                currentWord.push({ index: index, code: this.currentWord.charCodeAt(index) });
                guessedWord.push({ index: index, code: word.charCodeAt(index) });
            }
            //correct
            for (let index = 0; index < currentWord.length && index < guessedWord.length;) {
                const guessedChar = guessedWord[index];
                const originalChar = currentWord.find((value) => { return value.index == guessedChar.index; });
                if (originalChar && originalChar.code == guessedChar.code) {
                    letters[guessedChar.index] = new Letter(guessedChar.code, letterType.correct);
                    currentWord.splice(index, 1);
                    guessedWord.splice(index, 1);
                }
                else {
                    index++;
                }
            }
            //present
            for (let index = 0; index < currentWord.length && index < guessedWord.length;) {
                const guessedChar = guessedWord[index];
                const charIndexInWord = currentWord.findIndex((value) => { return value.code == guessedChar.code; });
                if (charIndexInWord > -1) {
                    letters[guessedChar.index] = new Letter(guessedChar.code, letterType.present);
                    currentWord.splice(charIndexInWord, 1);
                    guessedWord.splice(index, 1);
                }
                else {
                    index++;
                }
            }
            //absent
            for (let index = 0; index < currentWord.length && index < guessedWord.length; index++) {
                const guessedChar = guessedWord[index];
                letters[guessedChar.index] = new Letter(guessedChar.code, letterType.absent);
            }
            return letters;
        }
        else {
            return "Not in word list";
        }
    }
    generateWord() {
        const newIndex = Math.floor(Math.random() * (this._vocabulary.length - 1));
        this._wordIndex = newIndex;
    }
}
const comparator = new Comparator(__dirname + "/vocabulary.json");
let lastCapturedDate = new Date(Date.now());
setInterval(() => {
    if (new Date(Date.now()).getDate() != lastCapturedDate.getDate()) {
        comparator.generateWord();
        lastCapturedDate = new Date(Date.now());
    }
}, 1000);
router.post("/guess", (request, response) => {
    const word = request.query["word"];
    if (word) {
        response.send(comparator.guess(word));
    }
    else {
        response.statusMessage = "Missing word definition";
        response.sendStatus(400);
    }
});
router.get("/", (_request, response) => {
    response.sendFile(__dirname + "/index.html");
});
exports.default = router;
//# sourceMappingURL=index.js.map