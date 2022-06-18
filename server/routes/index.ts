import express = require('express');
import fs = require('fs');

const router = express.Router();

type mappedWord = { index: number, code: number }[];
type wordType = "daily" | "random";
type comparisonParams = { pickedWordIndex: number };

enum letterType
{
	correct = 2,
	present = 1,
	absent = 0
}

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

class Vocabulary
{
	private readonly _vocabulary: string[];

	public constructor(fileName: string)
	{
		this._vocabulary = JSON.parse(fs.readFileSync(fileName, "utf8"));
	}

	public get length(): number
	{
		return this._vocabulary.length;
	}

	public exist(word: string): boolean
	{
		return this.getWordIndex(word) >= 0;
	}

	public getWordIndex(word: string): number
	{
		return this._vocabulary.findIndex((value) => { return value.toLowerCase() == word.toLowerCase() });
	}

	public getWordByIndex(index: number): string
	{
		return this._vocabulary[index];
	}
}

class WordPicker
{
	private _vocabulary: Vocabulary;

	private _dailyIndex: number;

	public get dailyWord(): string
	{
		return this._vocabulary.getWordByIndex(this._dailyIndex);
	}

	public get dailyIndex(): number
	{
		return this._dailyIndex;
	}

	public set dailyIndex(value: number)
	{
		if (value >= 0 && value < this._vocabulary.length)
		{
			this._dailyIndex = value;
		}
	}

	public constructor(vocabulary: Vocabulary)
	{
		this._vocabulary = vocabulary;
		this._dailyIndex = this.pickRandomIndex();
	}

	public pickRandomIndex(): number
	{
		return Math.floor(Math.random() * (this._vocabulary.length - 1));
	}
}

class Comparator
{
	private _vocabulary: Vocabulary;

	private wordToCharIndices(word: string): mappedWord
	{
		const wordCharIndices: mappedWord = [];

		for (let index = 0; index < word.length; index++)
		{
			wordCharIndices.push({ index: index, code: word.charCodeAt(index) });
		}

		return wordCharIndices;
	}

	private findCorrectLetters(word: mappedWord, correctWord: mappedWord, foundLetters: Letter[]): Letter[]
	{
		const letters = foundLetters.slice();

		for (let index = 0; index < correctWord.length && index < word.length;)
		{
			const guessedChar = word[index];
			const originalChar = correctWord.find((value) => { return value.index == guessedChar.index; });

			if (originalChar && originalChar.code == guessedChar.code)
			{
				letters[guessedChar.index] = new Letter(guessedChar.code, letterType.correct);

				correctWord.splice(index, 1);
				word.splice(index, 1);
			}
			else
			{
				index++;
			}
		}

		return letters;
	}

	private findPresentLetters(word: mappedWord, correctWord: mappedWord, foundLetters: Letter[]): Letter[]
	{
		const letters = foundLetters.slice();

		for (let index = 0; index < correctWord.length && index < word.length;)
		{
			const guessedChar = word[index];
			const charIndexInWord = correctWord.findIndex((value) => { return value.code == guessedChar.code; });

			if (charIndexInWord >= 0)
			{
				letters[guessedChar.index] = new Letter(guessedChar.code, letterType.present);

				correctWord.splice(charIndexInWord, 1);
				word.splice(index, 1);
			}
			else
			{
				index++;
			}
		}

		return letters;
	}

	private addRemainingLetters(word: mappedWord, type: letterType, foundLetters: Letter[]): Letter[]
	{
		const letters = foundLetters.slice();

		for (let index = 0; index < word.length; index++)
		{
			const guessedChar = word[index];

			letters[guessedChar.index] = new Letter(guessedChar.code, type);
		}

		return letters;
	}

	public constructor(vocabulary: Vocabulary)
	{
		this._vocabulary = vocabulary;
	}

	public compare(correctWord: string, word: string): Letter[] | string
	{
		word = word.toLowerCase();
		correctWord = correctWord.toLowerCase();

		if (word.length < correctWord.length)
		{
			return "Not enough letters";
		}
		else if (word.length > correctWord.length)
		{
			return "Too many letters";
		}
		else if (this._vocabulary.exist(word))
		{
			const mappedCorrectWord: { index: number, code: number }[] = this.wordToCharIndices(correctWord);
			const mappedGuessedWord: { index: number, code: number }[] = this.wordToCharIndices(word);

			let letters: Letter[] = new Array<Letter>(word.length);

			letters = this.findCorrectLetters(mappedGuessedWord, mappedCorrectWord, letters);
			letters = this.findPresentLetters(mappedGuessedWord, mappedCorrectWord, letters);
			letters = this.addRemainingLetters(mappedGuessedWord, letterType.absent, letters);

			return letters;
		}
		else
		{
			return "Not in word list";
		}
	}
}

const englishVocabulary = new Vocabulary(__dirname + "/vocabulary.json");
const comparator = new Comparator(englishVocabulary);
const wordPicker = new WordPicker(englishVocabulary);

router.post("/guess", (request: express.Request, response: express.Response) =>
{
	const word = <string>request.query["word"];
	const comparisonParams = <string>request.query["comparisonParams"];

	if (word !== undefined && comparisonParams)
	{
		try
		{
			const parsedParams = <comparisonParams>JSON.parse(comparisonParams);
			response.send(comparator.compare(englishVocabulary.getWordByIndex(parsedParams.pickedWordIndex), word)).end();
		}
		catch
		{
			response.statusMessage = "Incorrect comparison parameters";
			response.sendStatus(400).end();
		}
	}
	else
	{
		response.statusMessage = "Missing necessary parameters";
		response.sendStatus(400).end();
	}
});

router.get("/", (_request: express.Request, response: express.Response) =>
{
	response.sendFile(__dirname + "/index.html");
})

router.get("/pick", (request: express.Request, response: express.Response) =>
{
	const type = <wordType>request.query["type"];

	if (type)
	{
		switch (type)
		{
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
	else
	{
		response.statusMessage = "Missing necessary parameters";
		response.sendStatus(400).end();
	}
});

export default router;