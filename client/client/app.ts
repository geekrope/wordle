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
	guessDistribution: number[];
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
	alert.innerText = text;

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
		container.innerText = content;
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

function createBlankStatistics(): UserStatistics
{
	return { correctAnswers: 0, totalAnswers: 0, guessDistribution: new Array<number>(rowsCount).fill(0), currentStreak: 0, maxStreak: 0 };
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

function createGuessDistributionItem(item: number, value: number, maxValue: number, color: string, width: string): HTMLDivElement
{
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

function createGuessDistribution(stats: UserStatistics): HTMLDivElement
{
	const element = document.createElement("div");
	const maxValue = Math.max.apply(null, stats.guessDistribution);

	element.className = "columnContainer";
	element.style.display = "flex";

	stats.guessDistribution.forEach((value, index) =>
	{
		const guessDistributionItem = createGuessDistributionItem(index + 1, value, maxValue, "rgb(120, 124, 126)", "100%");
		guessDistributionItem.style.paddingBottom = "4px";

		element.appendChild(guessDistributionItem);
	})

	return element;
}

function createStatisticsHeader(content: string): HTMLHeadingElement
{
	const element = document.createElement("h1");

	element.textContent = content;
	element.className = "statisticsText";
	element.style.fontSize = "16px";
	element.style.fontWeight = "700";

	return element;
}

function createStatisticsContentBlock(title: string, content: HTMLElement): HTMLDivElement
{
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

function createCloseButton(container: HTMLElement): HTMLImageElement
{
	const closeButton = document.createElement("img");
	closeButton.src = "close.svg";
	closeButton.className = "buttonIcon";
	closeButton.style.position = "absolute";
	closeButton.style.right = "16px";
	closeButton.style.top = "16px";
	closeButton.onclick = () => { container.remove(); };

	return closeButton;
}

function createStatisticsBox(stats: UserStatistics, container: HTMLElement): HTMLDivElement
{
	const element = document.createElement("div");
	element.className = "flex columnContainer statisticsContainer";
	element.style.position = "relative";

	const guessDistribution = createGuessDistribution(stats);
	guessDistribution.style.width = "80%";

	element.appendChild(createStatisticsContentBlock("STATISTICS", createStatisticsEvaluations(stats)));
	element.appendChild(createStatisticsContentBlock("GUESS DISTRIBUTION", guessDistribution));
	element.appendChild(createCloseButton(container));

	return element;
}

function createStatisticsParameter(name: string, value: number): HTMLDivElement
{
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

function createStatisticsEvaluations(stats: UserStatistics): HTMLDivElement
{
	const element = document.createElement("div");

	element.className = "rowContainer";
	element.style.display = "flex";
	element.style.width = "max(50%, 200px)";

	element.appendChild(createStatisticsParameter("Played", stats.totalAnswers));
	element.appendChild(createStatisticsParameter("Win %", Math.round(stats.correctAnswers / stats.totalAnswers * 100)));
	element.appendChild(createStatisticsParameter("Current streak", stats.currentStreak));
	element.appendChild(createStatisticsParameter("Max streak", stats.maxStreak));

	return element;
}

function createStatisticsOverlay(): HTMLDivElement
{
	const element = document.createElement("div");

	element.className = "overlay";
	element.appendChild(createStatisticsBox(getStatistics(), element));

	return element;
}

function getCurrentWord(): string
{
	let word = "";

	for (let index = 0; index < lettersCount; index++)
	{
		const letterElement = getLetter(index, currentRow);

		if (letterElement)
		{
			word += letterElement.innerText;
		}
	}

	return word;
}

function winHandler(): void
{
	window.alert("Bingo");

	let userStats = getStatistics();

	userStats.correctAnswers++;
	userStats.totalAnswers++;
	userStats.guessDistribution[currentRow]++;
	userStats.currentStreak++;
	userStats.maxStreak = userStats.currentStreak > userStats.maxStreak ? userStats.currentStreak : userStats.maxStreak;

	setStatistics(userStats);

	keysLocked = true;
}

function loseHandler(): void
{
	window.alert("Loss");

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

	const text = await (await fetch(`/guess?word=${word}&comparisonParams={"pickedWordIndex":${pickedWordIndex}}`, { method: "POST" })).text();

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
			letterElement.innerText = char;
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
				editedElement.innerText = "";
				setUnselectedLetterStyle(editedElement);
				currentColumn--;
			}
		}
	}
}

function decodeQuery(search: string): any
{
	if (search[0] == "?")
	{
		search = search.substring(1);
	}

	const splittedParameters = search.split("&").filter(element => element);;
	const result = {};

	splittedParameters.forEach((parameter) =>
	{
		const equalSignIndex = parameter.indexOf("=");
		const name = parameter.substring(0, equalSignIndex);
		const value = parameter.substring(equalSignIndex + 1);

		result[name] = value;
	});

	return result;
}

window.addEventListener("load", async () =>
{
	const wrapper = document.getElementById(wrapperId);

	if (wrapper)
	{
		wrapper.appendChild(createBoard());
		wrapper.appendChild(createKeyboard());
	}

	const urlParams = decodeQuery(window.location.search);
	const type = urlParams["type"];

	fetch(`/pick?type=${type ? type : "daily"}`).then(async (fulfilled) =>
	{
		if (fulfilled.ok)
		{
			pickedWordIndex = await fulfilled.text();
		}
		else
		{
			pickedWordIndex = await (await fetch(`/pick?type=daily`)).text();
		}

	});

	document.getElementById(statisticsOpenButtonId)?.addEventListener("click", () => { document.body.appendChild(createStatisticsOverlay()); });
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