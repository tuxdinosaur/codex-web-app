import Markdown from "./Markdown"
import React from "react"
import stylex from "stylex"

const Emphasis = props => (
	<em className="em">
		<Markdown start={props.syntax} end={props.syntax}>
			{props.children}
		</Markdown>
	</em>
)

const Strong = props => (
	<strong className="strong">
		<Markdown start={props.syntax} end={props.syntax}>
			{props.children}
		</Markdown>
	</strong>
)

const StrongEmphasis = props => (
	<strong className="strong-em">
		<Markdown start={props.syntax.slice(0, 2)} end={props.syntax.slice(1)}>
			<Markdown start={props.syntax.slice(-1)} end={props.syntax.slice(0, 1)}>
				{props.children}
			</Markdown>
		</Markdown>
	</strong>
)

const Code = props => (
	<code className="code" spellCheck={false}>
		<Markdown style={stylex.parse("c:gray")} start="`" end="`" >
			{props.children}
		</Markdown>
	</code>
)

// Shorthand for parseTextComponents
function recurse(data) {
	return parseTextComponents(data)
}

// Parses an array of React components from plain text data.
function parseTextComponents(data) {
	if (!data) {
		return ""
	}
	const components = []
	let index = 0
	let syntax = ""
	while (index < data.length) {
		const key = components.length      // Count the (current) number of components
		const char = data[index]           // Faster access
		const length = data.length - index // Faster access
		switch (true) {
		// Strong and or emphasis:
		case char === "*" || char === "_":
			syntax = char
			// Strong and emphasis (takes precedence):
			if (length >= "***x***".length && data.slice(index, index + 3) === syntax.repeat(3)) {
				syntax = syntax.repeat(3)
				const offset = data.slice(index + syntax.length).indexOf(syntax)
				if (offset <= 0) {
					break
				}
				index += syntax.length
				const children = recurse(data.slice(index, index + offset))
				components.push(<StrongEmphasis key={key} syntax={syntax}>{children}</StrongEmphasis>)
				index += offset + syntax.length - 1
				break
			// Strong (takes precedence):
			} else if (length >= "**x**".length && data.slice(index, index + 2) === syntax.repeat(2)) {
				syntax = syntax.repeat(2)
				const offset = data.slice(index + syntax.length).indexOf(syntax)
				if (offset <= 0) {
					break
				}
				index += syntax.length
				const children = recurse(data.slice(index, index + offset))
				components.push(<Strong key={key} syntax={syntax}>{children}</Strong>)
				index += offset + syntax.length - 1
				break
			// Emphasis:
			} else if (length >= "*x*".length) {
				// syntax = syntax.repeat(1)
				const offset = data.slice(index + syntax.length).indexOf(syntax)
				if (offset <= 0) {
					break
				}
				index += syntax.length
				const children = recurse(data.slice(index, index + offset))
				components.push(<Emphasis key={key} syntax={syntax}>{children}</Emphasis>)
				index += offset // + syntax.length - 1
				break
			}
			break
		// Code:
		case char === "`":
			if (length >= "`x`".length) {
				const offset = data.slice(index + 1).indexOf("`")
				if (offset <= 0) {
					break
				}
				index += "`".length
				const children = data.slice(index, index + offset)
				components.push(<Code key={key}>{children}</Code>)
				index += offset
				break
			}
			break
		default:
			break
		}
		// Text:
		if (key === components.length) {
			// Push new string component:
			if (!components.length || typeof components[components.length - 1] !== "string") {
				components.push(char)
			// Concatenate string:
			} else {
				components[components.length - 1] += char
			}
		}
		index++
	}
	return components
}

export default parseTextComponents