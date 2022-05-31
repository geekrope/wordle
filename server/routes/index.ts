import express = require('express');
import fs = require('fs');

const router = express.Router();

type letterType = "correct" | "present" | "absent";

class Letter
{
	private readonly _charCode: number;

	public readonly type: letterType;
	public get char(): string
	{
		return String.fromCharCode(this._charCode);
	}

	public constructor(charCode: number, type: letterType)
	{
		this._charCode = charCode;
		this.type = type;
	}
}

class Comparator
{
	private _wordIndex: number;
	private readonly wordLength: number = 5;
	private readonly _vocabulary: string[];

	private get currentWord(): string
	{
		return this._vocabulary[this._wordIndex];
	}

	public guess(word: string): Letter[] | string
	{
		word = word.toLowerCase();

		if (word.length < this.wordLength)
		{
			return "Not enough letters";
		}
		else if (word.length > this.wordLength)
		{
			return "Too many letters";
		}
		else if (this._vocabulary.includes(word))
		{
			const currentWord: { index: number, code: number }[] = [];
			const guessedWord: { index: number, code: number }[] = [];

			const letters: Letter[] = new Array<Letter>(this.wordLength);

			for (let index = 0; index < this.wordLength; index++)
			{
				currentWord.push({ index: index, code: this.currentWord.charCodeAt(index) });
				guessedWord.push({ index: index, code: word.charCodeAt(index) });
			}

			//correct
			for (let index = 0; index < currentWord.length && index < guessedWord.length;)
			{
				const orignalChar = currentWord[index];
				const guessedChar = guessedWord[index];

				if (orignalChar.code == guessedChar.code)
				{
					letters[guessedChar.index] = new Letter(guessedChar.code, "correct");

					currentWord.splice(index, 1);
					guessedWord.splice(index, 1);
				}
				else
				{
					index++;
				}
			}

			//present
			for (let index = 0; index < currentWord.length && index < guessedWord.length;)
			{
				const guessedChar = guessedWord[index];

				if (currentWord.findIndex((value) => { return value.code == guessedChar.code; }) >= 0)
				{
					letters[guessedChar.index] = new Letter(guessedChar.code, "present");

					currentWord.splice(index, 1);
					guessedWord.splice(index, 1);
				}
				else
				{
					index++;
				}
			}

			//absent
			for (let index = 0; index < currentWord.length && index < guessedWord.length; index++)
			{
				const guessedChar = guessedWord[index];

				letters[guessedChar.index] = new Letter(guessedChar.code, "absent");
			}

			return letters;
		}
		else
		{
			return "Not in word list";
		}
	}
	public generateWord(): void
	{
		const newIndex = Math.floor(Math.random() * (this._vocabulary.length - 1));

		this._wordIndex = newIndex;
	}

	public constructor(fileName: string)
	{
		this._vocabulary = JSON.parse(fs.readFileSync(fileName, "utf8"));
		this._wordIndex = -1;

		this.generateWord();
	}
}

const comparator = new Comparator(__dirname + "/vocabulary.json");

let lastCapturedDate = new Date(Date.now());

setInterval(() =>
{
	if (new Date(Date.now()).getDate() != lastCapturedDate.getDate())
	{
		comparator.generateWord();
		lastCapturedDate = new Date(Date.now());
	}
}, 1000);

router.post("/guess", (request: express.Request, response: express.Response) =>
{
	const word = <string>request.query["word"];

	if (word)
	{
		response.send(comparator.guess(word));
	}
	else
	{
		response.statusMessage = "Missing word definition";
		response.sendStatus(400);
	}
})

router.get("/", (_request: express.Request, response: express.Response) =>
{
	response.sendFile(__dirname + "/index.html");
})

export default router;