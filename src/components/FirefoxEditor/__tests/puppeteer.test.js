import Chromium from "puppeteer"
import fs from "fs"
import Gecko from "puppeteer-firefox"
import React from "react"
import ReactDOM from "react-dom"

const URL      = "http://localhost:3000" // eslint-disable-line no-multi-spaces
const SELECTOR = "[contenteditable]"     // eslint-disable-line no-multi-spaces
const DELAY    = 25                      // eslint-disable-line no-multi-spaces

;(function () {
	jest.setTimeout(180e3)
})()

// Opens a new page from a browser make.
async function openNewPage(ChromiumOrGecko, pageURL) {
	// Launch a browser:
	const browser = await ChromiumOrGecko.launch({ headless: false })
	// Create a new page:
	const page = await browser.newPage()
	await page.setViewport({ width: 1200, height: 780 })
	page.on("pageerror", error => expect(error).toBeNull())
	// Open the URL:
	await page.goto(pageURL, { timeout: 5e3 })
	// await page.addScriptTag({ path: "./innerText.js" })
	await page.addScriptTag({ path: "./src/components/FirefoxEditor/__tests/innerText.js" })
	return [page, () => browser.close()]
}

// Resets the character data.
async function reset(page) {
	await page.focus(SELECTOR)
	await page.evaluate(() => document.execCommand("selectall", false, null))
	await page.keyboard.press("Backspace", { delay: DELAY })
}

// Types character data.
async function type(page, data) {
	await page.keyboard.type(data, { delay: DELAY })
}

// Presses a key (e.g. keydown).
async function press(page, key) {
	await page.keyboard.press(key, { delay: DELAY })
}

// Code based on getData.
async function innerText(page) {
	return await page.$eval(SELECTOR, node => innerText(node))
}

/*
 * Tests
 */
async function helloWorld(page) {
	await reset(page)
	await type(page, "Hello, world!")
	const data = await innerText(page)
	expect(data).toBe("Hello, world!")
}

// async function runTestSuite(page) {
// 	// Basic type test (1 of 2):
// 	await reset(page)
// 	await type(page, "hello\nhello\nhello")
// 	const $1 = await innerText(page)
// 	expect($1).toBe("hello\nhello\nhello")
// 	// Basic type test (2 of 2):
// 	await reset(page)
// 	await type(page, "hello")
// 	await press(page, "ArrowLeft")
// 	await press(page, "ArrowLeft")
// 	await press(page, "ArrowLeft")
// 	await press(page, "ArrowLeft")
// 	await press(page, "ArrowLeft")
// 	await type(page, "hello")
// 	await press(page, "Enter")
// 	await type(page, "hello")
// 	await press(page, "Enter")
// 	const $2 = await innerText(page)
// 	expect($2).toBe("hello\nhello\nhello")
// 	// Repeat enter and backspace:
// 	await reset(page)
// 	for (const each of new Array(10)) { // 100
// 		await press(page, "Enter")
// 	}
// 	for (const each of new Array(10)) { // 100
// 		await press(page, "Backspace")
// 	}
// 	const $3 = await innerText(page)
// 	expect($3).toBe("\n") // <div contenteditable><br></div>
// 	// Repeat backspace:
// 	await reset(page)
// 	await type(page, "hello\nhello\nhello")
// 	for (const each of new Array(17)) {
// 		await press(page, "Backspace")
// 	}
// 	const $4 = await innerText(page)
// 	expect($4).toBe("\n")
// 	// Repeat backspace forward:
// 	await reset(page)
// 	await type(page, "hello\nhello\nhello")
// 	for (const each of new Array(17)) {
// 		await press(page, "ArrowLeft")
// 	}
// 	for (const each of new Array(17)) {
// 		await press(page, "Delete")
// 	}
// 	const $5 = await innerText(page)
// 	expect($5).toBe("\n")
// }

test("Chromium", async () => {
	const [page, close] = await openNewPage(Chromium, URL)
	await helloWorld(page)
	await close()
})

test("Gecko", async () => {
	const [page, close] = await openNewPage(Chromium, URL)
	await helloWorld(page)
	await close()
})
