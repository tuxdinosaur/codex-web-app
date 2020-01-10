import DebugEditor from "./DebugEditor"
import detect from "./detect"
import ErrorBoundary from "./ErrorBoundary"
import React from "react"
import scrollIntoViewIfNeeded from "./scrollIntoViewIfNeeded"
import stylex from "stylex"
import traverseDOM from "./traverseDOM"
import useEditor from "./EditorReducer"

import "./editor.css"

// FIXME?
export const Context = React.createContext()

export const Editor = props => {
	const ref = React.useRef()

	const [state, dispatch] = useEditor(`# Hello, world!

Hello, world!

\`\`\`
package main

import "fmt"

func main() {
	fmt.Println("hello, world!")
}
\`\`\`

Hello, world!

> Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
>
> Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Hello, world!

\`\`\`
package main

import "fmt"

func main() {
	fmt.Println("hello, world!")
}
\`\`\`

Hello, world!`)

	// Render components:
	React.useLayoutEffect(
		React.useCallback(() => {
			if (!state.isFocused) {
				// No-op.
				return
			}
			dispatch.render()
		}, [dispatch, state]),
		[state.shouldRenderComponents],
	)

	// Render cursor:
	React.useLayoutEffect(
		React.useCallback(() => {
			if (!state.isFocused) {
				// No-op.
				return
			}
			const range = document.createRange()
			const { node, offset } = traverseDOM.computeNodeFromPos(ref.current, state.pos1.pos, state.pos2.pos)
			range.setStart(node, offset)
			range.collapse()
			const selection = document.getSelection()
			selection.removeAllRanges()
			selection.addRange(range)
			// NOTE (1): Use `Math.floor` to mimic Chrome.
			// NOTE (2): Use `... - 1` to prevent jumping.
			const buffer = Math.floor(19 * 1.5) - 1
			scrollIntoViewIfNeeded({ top: (props.nav || 0) + buffer, bottom: buffer })
		}, [props, state]),
		[state.shouldRenderPos],
	)

	// Undo process:
	React.useEffect(
		React.useCallback(() => {
			if (!state.isFocused) {
				return
			}
			const id = setInterval(dispatch.storeUndo, 1e3)
			return () => {
				// Wait for the last undo to cycle:
				setTimeout(() => {
					clearInterval(id)
				}, 1e3)
			}
		}, [dispatch, state]),
		[state.isFocused],
	)

	// Scroll past end:
	let scrollPastEnd = {}
	if (props.scrollPastEnd) {
		scrollPastEnd = {
			// paddingBottom: "100vh",
			paddingBottom: `calc(100vh - ${
				Math.floor(19 * 1.5) + // Reuse `buffer` from `shouldRenderPos`.
				(props.nav || 0) +
				(props.mainInsetTop || 0) +
				(props.mainInsetBottom || 0)
			}px)`,
		}
	}

	// GPU optimization:
	let translateZ = {}
	if (state.isFocused) {
		translateZ = { transform: "translateZ(0px)" }
	}

	const { Provider } = Context
	return (
		<ErrorBoundary>
			<Provider value={[state, dispatch]}>
				{React.createElement(
					"article",
					{
						ref,

						style: {
							...scrollPastEnd,
							...translateZ,
						},

						contentEditable: true,
						suppressContentEditableWarning: true,

						onFocus: dispatch.opFocus,
						onBlur:  dispatch.opBlur,

						onSelect: e => {
							const { anchorNode, anchorOffset, focusNode, focusOffset } = document.getSelection()
							if (anchorNode === ref.current || focusNode === ref.current) {
								// No-op.
								return
							}
							const pos1 = traverseDOM.computePosFromNode(ref.current, anchorNode, anchorOffset)
							let pos2 = { ...pos1 }
							if (focusNode !== anchorNode || focusOffset !== anchorOffset) {
								pos2 = traverseDOM.computePosFromNode(ref.current, focusNode, focusOffset)
							}
							dispatch.setState(state.body, pos1, pos2)
						},

						onKeyPress: e => {
							e.preventDefault()
							let data = e.key
							if (e.key === "Enter") {
								data = "\n"
							}
							dispatch.opWrite("onKeyPress", data)
						},

						onKeyDown: e => {
							switch (true) {
							case detect.isTab(e):
								e.preventDefault()
								dispatch.opTab()
								return
							case detect.isBackspace(e):
								e.preventDefault()
								dispatch.opBackspace()
								return
							case detect.isBackspaceWord(e):
								e.preventDefault()
								dispatch.opBackspaceWord()
								return
							case detect.isBackspaceLine(e):
								e.preventDefault()
								dispatch.opBackspaceLine()
								return
							case detect.isDelete(e):
								e.preventDefault()
								dispatch.opDelete()
								return
							case detect.isDeleteWord(e):
								e.preventDefault()
								dispatch.opDeleteWord()
								return
							case detect.isUndo(e):
								e.preventDefault()
								dispatch.opUndo()
								return
							case detect.isRedo(e):
								e.preventDefault()
								dispatch.opRedo()
								return
							default:
								// No-op.
								return
							}
						},

						// onCompositionEnd: e => {
						// 	// ...
						// },

						// onInput: e => {
						// 	// ...
						// },

						onCut: e => {
							e.preventDefault()
							if (state.pos1.pos === state.pos2.pos) {
								// No-op.
								return
							}
							const cutData = state.body.data.slice(state.pos1.pos, state.pos2.pos)
							e.clipboardData.setData("text/plain", cutData)
							dispatch.opWrite("onCut", "")
						},

						onCopy: e => {
							e.preventDefault()
							if (state.pos1.pos === state.pos2.pos) {
								// No-op.
								return
							}
							const copyData = state.body.data.slice(state.pos1.pos, state.pos2.pos)
							e.clipboardData.setData("text/plain", copyData)
						},

						onPaste: e => {
							e.preventDefault()
							const pasteData = e.clipboardData.getData("text/plain")
							if (!pasteData) {
								// No-op.
								return
							}
							dispatch.opWrite("onPaste", pasteData)
						},

						// TODO
						onDragStart: e => e.preventDefault(),
						onDragEnd:   e => e.preventDefault(),
					},
					state.Components,
				)}
			</Provider>
			<div style={stylex.parse("h:28")} />
			<DebugEditor state={state} />
		</ErrorBoundary>
	)
}