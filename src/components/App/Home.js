// import Nav from "components/Nav"
import Editor from "components/Editor"
import Emoji from "utils/Emoji"
import Link from "utils/RouterLink"
import React from "react"
import { ReactComponent as CodexLogo } from "assets/codex.svg"

import "./Home.css"

const Nav = props => (
	<nav className="px-6 absolute inset-x-0 top-0 flex justify-center h-20 bg-white z-30">
		<div className="flex justify-between w-full max-w-screen-lg">

			{/* LHS: */}
			<Link to="/" className="flex items-center h-full hover:text-brand transition duration-150 ease-in-out">
				<CodexLogo style={{ width: "5.625rem", height: "3.75rem" }} />
			</Link>

			{/* RHS: */}
			<div className="flex items-center h-full">
				{/* <Link */}
				{/* 	className="px-2 flex items-center h-full text-gray-900 hover:text-brand transition duration-75 ease-in-out" */}
				{/* 	to="#features" */}
				{/* 	children="Features" */}
				{/* /> */}
				{/* <Link */}
				{/* 	className="px-2 flex items-center h-full text-gray-900 hover:text-brand transition duration-75 ease-in-out" */}
				{/* 	to="#pricing" */}
				{/* 	children="Pricing" */}
				{/* /> */}
				{/* <Link */}
				{/* 	className="px-2 flex items-center h-full text-gray-900 hover:text-brand transition duration-75 ease-in-out" */}
				{/* 	to="/sign-in" */}
				{/* 	children="Login" */}
				{/* /> */}
				{/* CTA: */}
				<Link
					className="-mr-4 px-4 flex items-center h-full"
					to="/demo"
				>
					<div className="px-3 py-2 text-brand border border-brand rounded-sm">
						<p className="font-medium">
							Try the editor alpha
						</p>
					</div>
				</Link>
			</div>
		</div>
	</nav>
)

const Hero = props => (
	<section className="px-6 py-32 flex justify-center items-center min-h-screen">
		<div className="flex lg:flex-row flex-col items-center w-full max-w-screen-lg">

			{/* LHS: */}
			<div className="w-full flex lg:block flex-col md:items-start items-center">
				<h1 className="font-bold text-4xl leading-1.3">
					Introducing Codex{"\u00a0"}
					<Emoji emoji="✨" />
				</h1>
				{/* Spacer: */}
				<div className="h-4" />
				<p className="text-2xl text-gray-700">
					Codex is a digital notebook for authors, built for the modern web.
					It supports markdown and works everywhere.
				</p>
				{/* Spacer: */}
				<div className="h-8" />
				<Link
					className="py-1 block"
					to="/demo"
				>
					<p className="font-medium text-2xl text-brand">
						Try the editor alpha!
					</p>
				</Link>
				{/* <Link */}
				{/* 	className="py-1 block" */}
				{/* 	to="#features" */}
				{/* > */}
				{/* 	<p className="font-medium text-2xl text-brand"> */}
				{/* 		Learn more */}
				{/* 	</p> */}
				{/* </Link> */}
			</div>

			{/* Spacer: */}
			<div className="w-24 h-12" />

			{/* RHS: */}
			<div className="w-full">
				<MarketingEditor />
			</div>

		</div>
	</section>
)

// TODO: Show markdown background
function MarketingEditor(props) {
	const [state, dispatch] = Editor.useEditor(`There comes a time in every developer’s career when you feel the sudden urge to build a blog. Not just any blog — no, **your blog**…the best blog there ever was.

And it will be magnificent!

It will support everything from _italics_, **bold**, \`code\`, and ~strikethrough~. Even emoji, dammit!

🔥🔥🔥

Why stop there?!

What about blockquotes?

> Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
>
> …whatever the hell that means

Done.

What about code blocks?

\`\`\`
package main

import "fmt"

func main() {
	fmt.Println("Hello, world!")
}
\`\`\`

Done!

What about syntax highlighted code blocks?!

\`\`\`main.go
package main

import "fmt"

func main() {
	fmt.Println("Hello, world!")
}
\`\`\`

Done, baby! 😉

// Why stop there? Why not support comments **only you can see**? 👻

For then, and only then, would you rule.

So, how would you build it? **You don’t have to.** Just use Codex.

**Codex is a new platform for authors to write _and format_ their every thought in plain ‘ol markdown. Notes are automatically backed up to the cloud.**

Codex works in all modern browser, even on mobile.

We hope you love it. ❤️
`) // FIXME: EOF

	return (
		// Preserve aspect ratio:
		<div id="marketing-editor" className="pb-4/5 relative">
			<div className="absolute inset-0">
				{/* Two shadows: */}
				<div className="h-full rounded-xl shadow-xs">
					<div className="px-6 py-4 h-full bg-white rounded-xl shadow-xl overflow-y-scroll scrolling-touch">
						<Editor.Editor
							state={state}
							dispatch={dispatch}
						/>
					</div>
				</div>
			</div>
		</div>
	)
}

// function FullscreenEditor(props) {
// 	const [state, dispatch] = Editor.useEditor("# Hello, world!")
//
// 	return (
// 		// Preserve aspect ratio:
// 		<div className="pb-9/16 relative">
// 			<div className="absolute inset-0">
// 				{/* Two shadows: */}
// 				<div className="h-full rounded-xl shadow-xs">
// 					<div className="px-6 py-4 h-full bg-white rounded-xl shadow-xl overflow-y-scroll scrolling-touch">
// 						<Editor.Editor
// 							state={state}
// 							dispatch={dispatch}
// 						/>
// 					</div>
// 				</div>
// 			</div>
// 		</div>
// 	)
// }

const Home = props => (
	<div className="!debug-css">
		<Nav />

		<Hero />

		{/* <div className="bg-gray-100"> */}
		{/* 	<section className="px-6 py-32 min-h-screen bg-gray-100"> */}
		{/* 		<FullscreenEditor /> */}
		{/* 	</section> */}
		{/* </div> */}

		{/* <div className="h-screen bg-gray-100"></div> */}
		{/* <div className="h-screen"></div> */}
		{/* <div className="h-screen bg-gray-100"></div> */}
	</div>
)

export default Home