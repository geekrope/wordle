const lettersCount = 5;
const rowsCount = 6;
const animationDelay = 0.2;
const alphabet = /^[A-Za-z0-9]*$/;
const statisticsId = "statistics";
const guessesId = "guesses";

type letterType = "correct" | "present" | "absent";

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

function getLetterId(column: number, row: number): string
{
	return "letter" + column + "_" + row;
}

function getLetter(column: number, row: number): HTMLElement | null
{
	return document.getElementById(getLetterId(column, row));
}

function createRow(row: number): HTMLDivElement
{
	const container = document.createElement("div");
	container.className = "flex rowContainer";

	for (let column = 0; column < lettersCount; column++)
	{
		const letterContainer = document.createElement("div");

		letterContainer.className = "letterContainer unspecifiedLetter";
		letterContainer.id = getLetterId(column, row);

		container.appendChild(letterContainer);
	}

	return container;
}

function createBoard(): HTMLDivElement
{
	const container = document.createElement("div");
	container.className = "flex columnContainer";

	for (let row = 0; row < rowsCount; row++)
	{
		container.appendChild(createRow(row));
	}

	return container;
}

function createBlankStatistics(): UserStatistics
{
	return { correctAnswers: 0, totalAnswers: 0, guessesDistribution: new Array<number>(rowsCount).fill(0), currentStreak: 0, maxStreak: 0 };
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

function setStatistics(stats: UserStatistics)
{
	localStorage.setItem(statisticsId, JSON.stringify(stats));
}

async function submitCurrentRow(): Promise<boolean | string>
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

	const text = await (await fetch(`/guess?word=${word}`, { method: "POST" })).text();

	try
	{
		const specifiedWord = JSON.parse(text) as { type: letterType, _charCode: number }[];

		let correctLetters = 0;

		specifiedWord.forEach((value, index) =>
		{
			const letterElement = getLetter(index, currentRow);

			if (letterElement)
			{
				switch (value.type)
				{
					case "correct":
						letterElement.className = "letterContainer specifiedLetter specifiedCorrect";
						correctLetters++;
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

		return correctLetters == lettersCount;
	}
	catch
	{
		return text;
	}
}

function winHandler()
{
	alert("biungo");

	let userStats = getStatistics();

	userStats.correctAnswers++;
	userStats.totalAnswers++;
	userStats.guessesDistribution[currentRow]++;
	userStats.currentStreak++;
	userStats.maxStreak = userStats.currentStreak > userStats.maxStreak ? userStats.currentStreak : userStats.maxStreak;

	setStatistics(userStats);
}

function loseHandler()
{
	alert("jsdngiksdkg");

	let userStats = getStatistics();

	userStats.totalAnswers++;
	userStats.currentStreak = 0;

	setStatistics(userStats);
}

function keyHandler(charCode: number)
{
	const char = String.fromCharCode(charCode);
	const letterElement = getLetter(currentColumn, currentRow);

	if (alphabet.test(char) && letterElement && (currentColumn != lettersCount - 1 || letterElement.innerHTML.length == 0))
	{
		letterElement.innerHTML = char;
		currentColumn = Math.min(currentColumn + 1, lettersCount - 1);
	}
	else if (charCode == 13) //enter
	{
		const win = submitCurrentRow();

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
			}
		})
	}
	else if (charCode == 8 && currentColumn - 1 >= 0 && letterElement && letterElement.innerHTML.length == 0) //backspace
	{
		const editedElement = getLetter(currentColumn - 1, currentRow);

		if (editedElement)
		{
			editedElement.innerHTML = "";
		}

		currentColumn--;
	}
	else if (charCode == 8 && letterElement)
	{
		letterElement.innerHTML = "";
	}
}

window.addEventListener("load", () =>
{
	document.body.appendChild(createBoard());
});

window.addEventListener("keydown", (event) =>
{
	keyHandler(event.keyCode);
});