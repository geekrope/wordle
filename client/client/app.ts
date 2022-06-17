const lettersCount = 5;
const rowsCount = 6;
const animationDelay = 0.2;
const alphabet = /^[A-Za-z0-9]*$/;
const statisticsId = "statistics";
const guessesId = "guesses";
const wrapperId = "wrapper";
const alertsContainerId = "alerts";

let pickedWord = "";

enum letterType
{
	correct = 2,
	present = 1,
	absent = 0
}

const keyboardRow1: { content: string | undefined, code: number, flex?: number }[] = [
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
const keyboardRow2: { content: string | undefined, code: number, flex?: number }[] = [
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
const keyboardRow3: { content: string | undefined, code: number, flex?: number }[] = [
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

let keyboardMap: Map<number, letterType> = new Map<number, letterType>();
let keysLocked = false;

let currentRow = 0;
let currentColumn = 0;

interface UserStatistics
{
	correctAnswers: number;
	totalAnswers: number;
	guessesDistribution: number[];
	currentStreak: number;
	maxStreak: number;
}

function toUpper(code: number): number
{
	return String.fromCharCode(code).toUpperCase().charCodeAt(0);
}

function getLetterId(column: number, row: number): string
{
	return "letter" + column + "_" + row;
}

function getLetter(column: number, row: number): HTMLElement | null
{
	return document.getElementById(getLetterId(column, row));
}

function getKeyId(code: number): string
{
	return "key_" + code;
}

function getKey(code: number): HTMLElement | null
{
	return document.getElementById(getKeyId(code));
}

function getRowId(index: number): string
{
	return "row_" + index;
}

function getRow(index: number): HTMLElement | null
{
	return document.getElementById(getRowId(index));
}

function createRow(row: number): HTMLDivElement
{
	const container = document.createElement("div");
	container.className = "flex rowContainer";
	container.style.width = "calc(var(--size) * 330)";
	container.id = getRowId(row);

	for (let column = 0; column < lettersCount; column++)
	{
		const letterContainer = document.createElement("div");

		letterContainer.className = "innerCentralAlign letterContainer unspecifiedLetter";
		letterContainer.id = getLetterId(column, row);

		container.appendChild(letterContainer);
	}

	return container;
}

function createBoard(): HTMLDivElement
{
	const container = document.createElement("div");
	container.className = "flex columnContainer";
	container.style.height = "calc(var(--size) * 400)";

	for (let row = 0; row < rowsCount; row++)
	{
		const rowElement = createRow(row);
		rowElement.id = getRowId(row);

		container.appendChild(rowElement);
	}

	return container;
}

function createAlert(text: string): HTMLDivElement
{
	const alert = document.createElement("div");
	alert.className = "alertBox";
	alert.innerHTML = text;

	const animation = alert.animate([
		{ opacity: 1, offset: 0 },
		{ opacity: 1, offset: 0.7 },
		{ opacity: 0, offset: 1, easing: "cubic-bezier(0.645, 0.045, 0.355, 1)" }
	], { duration: 1000 });

	animation.onfinish = () =>
	{
		alert.remove();
	}

	return alert;
}

function createBlankStatistics(): UserStatistics
{
	return { correctAnswers: 0, totalAnswers: 0, guessesDistribution: new Array<number>(rowsCount).fill(0), currentStreak: 0, maxStreak: 0 };
}

function shakeCurrentRow(): void
{
	const row = getRow(currentRow);

	if (row)
	{
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
		], 600)
	}
}

function createKey(content: string, action: () => void): HTMLDivElement
{
	const container = document.createElement("div");
	container.className = "innerCentralAlign keyStyle";

	if (content[0] == "@")
	{
		container.innerHTML = `<img src="${content.substring(1)}"></img>`;
	}
	else
	{
		container.innerHTML = content;
	}

	container.onclick = action;

	return container;
}

function createKeyboardRow(row: { content: string | undefined, code: number, flex?: number }[]): HTMLDivElement
{
	const container = document.createElement("div");
	container.className = "rowContainer";
	container.style.display = "flex";
	container.style.justifyContent = "center";
	container.style.width = "calc(var(--key-size)*484)";
	container.style.padding = "0 calc(var(--key-size)*8) 0 calc(var(--key-size)*8)";

	row.forEach((value, index) =>
	{
		const key = createKey(value.content ? value.content : String.fromCharCode(value.code), () => { keyHandler(value.code) });

		if (index < row.length - 1)
		{
			key.style.marginRight = "calc(var(--size) * 6)";
		}
		if (value.flex)
		{
			key.style.flex = value.flex.toString();
		}

		key.id = getKeyId(value.code);

		container.appendChild(key);
	});

	return container;
}

function createKeyboard(): HTMLDivElement
{
	const container = document.createElement("div");
	container.className = "flex columnContainer";
	container.style.height = "200px";
	container.style.paddingBottom = "10px";

	container.appendChild(createKeyboardRow(keyboardRow1));
	container.appendChild(createKeyboardRow(keyboardRow2));
	container.appendChild(createKeyboardRow(keyboardRow3));

	return container;
}

function getStatistics(): UserStatistics
{
	const stats = localStorage.getItem(statisticsId);

	if (stats)
	{
		return JSON.parse(stats);
	}
	else
	{
		const blank = createBlankStatistics();

		setStatistics(blank);

		return blank;
	}
}

function setStatistics(stats: UserStatistics): void
{
	localStorage.setItem(statisticsId, JSON.stringify(stats));
}

function getCurrentWord(): string
{
	let word = "";

	for (let index = 0; index < lettersCount; index++)
	{
		const letterElement = getLetter(index, currentRow);

		if (letterElement)
		{
			word += letterElement.innerHTML;
		}
	}

	return word;
}

function winHandler(): void
{
	alert("bingo");

	let userStats = getStatistics();

	userStats.correctAnswers++;
	userStats.totalAnswers++;
	userStats.guessesDistribution[currentRow]++;
	userStats.currentStreak++;
	userStats.maxStreak = userStats.currentStreak > userStats.maxStreak ? userStats.currentStreak : userStats.maxStreak;

	setStatistics(userStats);

	keysLocked = true;
}

function loseHandler(): void
{
	alert("jsdngiksdkg");

	let userStats = getStatistics();

	userStats.totalAnswers++;
	userStats.currentStreak = 0;

	setStatistics(userStats);

	keysLocked = true;
}

async function checkCurrentRow(): Promise<boolean | string>
{
	keysLocked = true;

	const word = getCurrentWord();

	const text = await (await fetch(`/guess?word=${word}&daily=false&comparisonParams=${pickedWord}`, { method: "POST" })).text();

	try
	{
		const specifiedWord = JSON.parse(text) as { type: letterType, _charCode: number }[];

		let correctLetters = 0;

		specifiedWord.forEach((value, index) =>
		{
			setSpecifiedLetterStyle(index, currentRow, value.type);
			setKeyboardLetterStyle(toUpper(value._charCode), value.type);

			if (value.type == letterType.correct)
			{
				correctLetters++;
			}
		});

		keysLocked = false;

		return correctLetters == lettersCount;
	}
	catch
	{
		keysLocked = false;

		return text;
	}
}

function setSelectedLetterStyle(letterElement: HTMLElement): void
{
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

function setUnselectedLetterStyle(letterElement: HTMLElement): void
{
	letterElement.style.borderColor = "var(--border-unspecified)";
}

function setSpecifiedLetterStyle(index: number, row: number, type: letterType): void
{
	const letterElement = getLetter(index, row);

	if (letterElement)
	{
		switch (type)
		{
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

function setKeyboardLetterStyle(code: number, type: letterType)
{
	const key = getKey(code);

	if (((keyboardMap.has(code) && keyboardMap.get(code)! < type) || !keyboardMap.has(code)) && key)
	{
		switch (type)
		{
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

function keyHandler(charCode: number): void
{
	if (!keysLocked)
	{
		const char = String.fromCharCode(charCode);
		const letterElement = getLetter(currentColumn, currentRow);

		if (alphabet.test(char) && currentColumn < lettersCount && letterElement)
		{
			letterElement.innerHTML = char;
			currentColumn++;

			setSelectedLetterStyle(letterElement);
		}
		else if (charCode == 13)
		{
			const win = checkCurrentRow();

			win.then((value) =>
			{
				if (typeof value == "boolean")
				{
					if (value)
					{
						winHandler();
					}
					else if (currentRow + 1 >= rowsCount)
					{
						loseHandler();
					}
					else
					{
						currentColumn = 0;
						currentRow++;
					}
				}
				else
				{
					window.alert(value);

					shakeCurrentRow();
				}
			})
		}
		else if (charCode == 8 && currentColumn - 1 >= 0)
		{
			const editedElement = getLetter(currentColumn - 1, currentRow);

			if (editedElement)
			{
				editedElement.innerHTML = "";
				setUnselectedLetterStyle(editedElement);
				currentColumn--;
			}
		}
	}
}

window.addEventListener("load", async () =>
{
	const wrapper = document.getElementById(wrapperId);

	if (wrapper)
	{
		wrapper.appendChild(createBoard());
		wrapper.appendChild(createKeyboard());
	}

	pickedWord = await (await fetch("/pick")).text();
});

window.addEventListener("keydown", (event) =>
{
	keyHandler(event.keyCode);
});

window.alert = (message: any) =>
{
	const alertsContainer = document.getElementById(alertsContainerId);

	if (alertsContainer)
	{
		alertsContainer.insertBefore(createAlert(message), alertsContainer.firstChild);
	}
}