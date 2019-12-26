import ascii from "./ascii"
import React from "react"
import stylex from "stylex"
import useMethods from "use-methods"
import vdom from "./vdom"

// FIXME: Pre-parse styles.
const Syntax = ({ style, ...props }) => (
	<React.Fragment>
		{props.start && (
			<span style={{
				...stylex.parse("c:blue-a400"),
				...style,
			}}>
				{props.start}
			</span>
		)}
		{props.children}
		{props.end && (
			<span style={{
				...stylex.parse("c:blue-a400"),
				...style,
			}}>
				{props.end}
			</span>
		)}
	</React.Fragment>
)

const H1 = props => <h1 style={stylex.parse("fw:700 fs:19")}><Syntax start="#&nbsp;">{props.children}</Syntax></h1>
const H2 = props => <h2 style={stylex.parse("fw:700 fs:19")}><Syntax start="##&nbsp;">{props.children}</Syntax></h2>
const H3 = props => <h3 style={stylex.parse("fw:700 fs:19")}><Syntax start="###&nbsp;">{props.children}</Syntax></h3>
const H4 = props => <h4 style={stylex.parse("fw:700 fs:19")}><Syntax start="####&nbsp;">{props.children}</Syntax></h4>
const H5 = props => <h5 style={stylex.parse("fw:700 fs:19")}><Syntax start="#####&nbsp;">{props.children}</Syntax></h5>
const H6 = props => <h6 style={stylex.parse("fw:700 fs:19")}><Syntax start="######&nbsp;">{props.children}</Syntax></h6>

const Comment = props => (
	<p style={stylex.parse("fs:19 c:gray")}>
		<Syntax style={stylex.parse("c:gray")} start="//&nbsp;">
			{props.children}
		</Syntax>
	</p>
)

// Compound component.
const Blockquote = props => (
	<blockquote>
		<ul>
			{props.children.map(each => (
				<li key={each.key} style={stylex.parse("fs:19")}>
					<Syntax start=">&nbsp;">
						{each.data || (
							<br />
						)}
					</Syntax>
				</li>
			))}
		</ul>
	</blockquote>
)

// FIXME?
const CodeLine = props => (
	<code style={stylex.parse("p:16 block b:gray-100 br:8")}>
		<p style={{ ...stylex.parse("fs:16 lh:125%"), fontFamily: "Monaco" }}>
			<Syntax start="```" end="```">
				{props.children}
			</Syntax>
		</p>
	</code>
)

// Compound component.
const CodeBlock = props => (
	<code style={stylex.parse("p:16 block b:gray-100 br:8")}>
		<ul>
			{props.children.map((each, index) => (
				<li key={each.key} style={{ ...stylex.parse("fs:16 lh:125%"), fontFamily: "Monaco" }}>
					<Syntax start={!index && "```"} end={index + 1 === props.children.length && "```"}>
						{each.data || (
							index > 0 && index + 1 < props.children.length && (
								<br />
							)
						)}
					</Syntax>
				</li>
			))}
		</ul>
	</code>
)

const Break = props => (
	<p style={stylex.parse("fs:19 c:gray")}>
		<Syntax start="---" />
	</p>
)

const Paragraph = props => (
	<p style={stylex.parse("fs:19")}>
		{props.children}
	</p>
)

// Convenience function.
function isBlockquote(data) {
	const ok = (
		(data.length === 1 && data[0] === ">") || // Empty.
		(data.length >= 2 && data.slice(0, 2) === "> ")
	)
	return ok
}

// Convenience function.
function isCodeBlockEnd(data) {
	const ok = (
		data.length === 3 &&
		data === "```"
	)
	return ok
}

// TODO:
//
// <UnorderedList>
// <OrderedList>
//
// TODO: We could have `parse` and `parseStrict` parsers for
// parsing loose or strict (GFM) markdown.
function parse(body) {
	const Components = []
	let index = 0
	while (index < body.nodes.length) {
		const { key, data } = body.nodes[index]
		/* eslint-disable no-case-declarations */
		switch (true) {

		// <Paragraph> (fast pass):
		case (
			!data.length || (
				data.length &&
				ascii.isAlphanum(data[0])
			)
		):
			Components.push((
				<Paragraph key={key}>
					{data || (
						<br />
					)}
				</Paragraph>
			))
			break

		// <H1-H6>:
		case (
			(data.length >= 2 && data.slice(0, 2) === ("# ")) ||
			(data.length >= 3 && data.slice(0, 3) === ("## ")) ||
			(data.length >= 4 && data.slice(0, 4) === ("### ")) ||
			(data.length >= 5 && data.slice(0, 5) === ("#### ")) ||
			(data.length >= 6 && data.slice(0, 6) === ("##### ")) ||
			(data.length >= 7 && data.slice(0, 7) === ("###### "))
		):
			const indexHeader = data.indexOf("# ")
			const ComponentHeader = [H1, H2, H3, H4, H5, H6][indexHeader]
			Components.push((
				<ComponentHeader key={key}>
					{data.slice(indexHeader + 2) || (
						<br />
					)}
				</ComponentHeader>
			))
			break

		// <Comment>:
		case data.length >= 3 && data.slice(0, 3) === "// ":
			Components.push((
				<Comment key={key}>
					{data.slice(3) || (
						<br />
					)}
				</Comment>
			))
			break

		// <Blockquote>:
		case isBlockquote(data):
			const bquoteStart = index
			index++
			while (index < body.nodes.length) {
				if (!isBlockquote(body.nodes[index].data)) {
					break
				}
				index++
			}
			const bquoteNodes = body.nodes.slice(bquoteStart, index)
			Components.push((
				<Blockquote key={key}>
					{bquoteNodes.map(each => (
						{
							...each,
							data: each.data.slice(2),
						}
					))}
				</Blockquote>
			))
			// NOTE: Decrement because `index` will be auto-
			// incremented.
			index--
			break

		// <CodeLine>:
		case (
			data.length >= 6 && (
				data.slice(0, 3) === "```" &&
				data.slice(-3) === "```"
			)
		):
			// FIXME
			Components.push((
				<CodeLine key={key}>
					{data.slice(3, -3) // || (
						// <br />
					/* ) */ }
				</CodeLine>
			))
			break

		// <CodeBlock>:
		case data.length >= 3 && data.slice(0, 3) === "```":
			const cblockStart = index
			index++
			let cblockDidTerminate = false
			while (index < body.nodes.length) {
				if (isCodeBlockEnd(body.nodes[index].data)) {
					cblockDidTerminate = true
					break
				}
				index++
			}
			index++
			// Guard unterminated code block:
			if (!cblockDidTerminate) {
				Components.push((
					<Paragraph key={key}>
						{data || (
							<br />
						)}
					</Paragraph>
				))
				index = cblockStart
				break
			}
			const cblockNodes = body.nodes.slice(cblockStart, index)
			Components.push((
				<CodeBlock key={key}>
					{cblockNodes.map((each, index) => (
						{
							...each,
							data: !index || index + 1 === cblockNodes.length ? each.data.slice(3) : each.data,
						}
					))}
				</CodeBlock>
			))
			// NOTE: Decrement because `index` will be auto-
			// incremented.
			index--
			break

		// <Break>:
		case (
			data.length === 3 && (
				data === "***" ||
				data === "---"
			)
		):
			Components.push((
				<Break key={key}>
					{data || (
						<br />
					)}
				</Break>
			))
			break

		// <Paragraph>:
		default:
			Components.push((
				<Paragraph key={key}>
					{data || (
						<br />
					)}
				</Paragraph>
			))
			break

		}
		/* eslint-enable no-case-declarations */
		index++
	}
	return Components
}

const initialState = {
	pos1:       0,
	pos2:       0,
	body:       new vdom.VDOM("hello, world!\n\n> asdasdasd\n\n```asdasd```\n\n```\n\nasdasd\n\n```"),
	Components: [],
}

const reducer = state => ({
	select(pos1, pos2) {
		if (pos1 < pos2) {
			Object.assign(state, { pos1, pos2 })
		} else {
			Object.assign(state, { pos1: pos2, pos2: pos1 })
		}
	},
	setState({ inputType, data }, pos1, pos2) {
		switch (inputType) {
		case "insertText":
			state.body = state.body.write(data, pos1, pos2)
			this.render()
			break
		case "deleteContentBackward":
			if (pos1 === pos2) {
				pos1 -= pos1 > 0
			}
			state.body = state.body.write("", pos1, pos2)
			this.render()
			break
		case "insertLineBreak":
			state.body = state.body.write("\n", pos1, pos2)
			this.render()
			break
		default:
			// No-op.
			break
		}
	},
	render() {
		state.Components = parse(state.body)
	},
})

function init(state) {
	return { ...state, Components: parse(state.body) }
}

function TestEditor(props) {
	const ref = React.useRef()

	const [state, dispatch] = useMethods(reducer, initialState, init)

	return (
		<div>
			<textarea
				ref={ref}
				style={{ ...stylex.parse("p:16 block w:max h:256 b:gray-100 br:8"), fontFamily: "Monaco" }}
				value={state.body.data}
				onSelect={e => dispatch.select(ref.current.selectionStart, ref.current.selectionEnd)}
				onChange={e => dispatch.setState(e.nativeEvent, state.pos1, state.pos2)}
				autoFocus
			/>
			<div style={stylex.parse("h:57")} />
			<article>
				{state.Components}
			</article>
		</div>
	)
}

export default TestEditor