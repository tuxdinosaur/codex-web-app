// import getCoords from "./helpers/getCoords"
import * as detect from "./helpers/detect"
import getPos from "./helpers/getPos"
import getPosFromRange from "./helpers/getPosFromRange"
import getRangeFromPos from "./helpers/getRangeFromPos"
import innerText from "./helpers/innerText"
import NodeIterator from "./helpers/NodeIterator"
import React from "react"
import ReactDOM from "react-dom"
import syncTrees from "./helpers/syncTrees"
import uuidv4 from "uuid/v4"

/* purgecss start ignore */
import "./index.css"
/* purgecss end ignore */

/* eslint-disable no-multi-spaces */
const KEY_CODE_TAB   = 9
const KEY_CODE_ENTER = 13
const KEY_CODE_1     = 49
const KEY_CODE_2     = 50
const KEY_CODE_P     = 80
/* eslint-enable no-multi-spaces */

// const SCROLL_BUFFER = 12

// Creates a new start and end node iterator.
//
// TODO: Extract to helpers?
function newNodeIterators() {
	const range = document.getSelection().getRangeAt(0)
	const { startContainer, endContainer } = range
	// Extend the target start (up to 2x):
	const start = new NodeIterator(startContainer)
	while (start.count < 2 && start.getPrev()) {
		start.prev()
	}
	// Extend the target end (up to 2x):
	const end = new NodeIterator(endContainer)
	while (end.count < 2 && end.getNext()) {
		end.next()
	}
	return [start, end]
}

// Gets (reads) parsed nodes from node iterators.
//
// TODO: Extract to helpers?
function getNodesFromIterators(rootNode, [start, end]) {
	// Re-extend the target start (up to 1x):
	if (!start.count && start.getPrev()) {
		start.prev()
	}
	// NOTE: Do not re-extend the target end
	const atEnd = !end.count
	// Get nodes:
	const seenKeys = {}
	const nodes = []
	while (start.currentNode) {
		// Read the key:
		let key = start.currentNode.getAttribute("data-node")
		if (seenKeys[key]) {
			key = uuidv4()
			start.currentNode.setAttribute("data-node", key)
		}
		// Read the data:
		seenKeys[key] = true
		const data = innerText(start.currentNode)
		nodes.push({ key, data })
		if (start.currentNode === end.currentNode) {
			// No-op
			break
		}
		start.next()
	}
	return { nodes, atEnd }
}

export function Editor({ state, dispatch, ...props }) {
	const ref = React.useRef()
	const target = React.useRef()

	// Extraneous refs:
	const pointerDown = React.useRef()
	const dedupedCompositionEnd = React.useRef()

	// Register props (once):
	//
	// NOTE: Do not use props as a dependency because the
	// reference (object) changes on every render
	//
	// TODO: Can use known props (props members) as
	// dependencies
	const propsRef = React.useRef(props)
	React.useLayoutEffect(() => {
		dispatch.registerProps(propsRef.current)
	}, [dispatch])

	// import getPosFromRange from "./getPosFromRange"
	//
	// // Gets the cursors.
	// //
	// // TODO: Can optimize pos2 by reusing pos1
	// function getPos(rootNode) {
	// 	const range = document.getSelection().getRangeAt(0)
	// 	const pos1 = getPosFromRange(rootNode, range.startContainer, range.startOffset)
	// 	let pos2 = { ...pos1 }
	// 	if (!range.collapsed) {
	// 		pos2 = getPosFromRange(rootNode, range.endContainer, range.endOffset)
	// 	}
	// 	return [pos1, pos2]
	// }

	React.useLayoutEffect(
		React.useCallback(() => {
			ReactDOM.render(state.components, state.reactDOM, () => {
				// Sync the user and React-managed DOMs:
				const mutations = syncTrees(ref.current, state.reactDOM)
				if ((!state.components || !mutations) && state.actionType !== "PASTE") {
					// No-op
					return
				}
				// Reset the cursor:
				const selection = document.getSelection()
				if (selection.rangeCount) {
					selection.removeAllRanges()
				}
				const range = document.createRange()
				const { node, offset } = getRangeFromPos(ref.current, state.pos1.pos)
				range.setStart(node, offset)
				range.collapse()
				if (state.pos1.pos !== state.pos2.pos) {
					// TODO: Can optimize pos2 by reusing pos1
					const { node, offset } = getRangeFromPos(ref.current, state.pos2.pos)
					range.setEnd(node, offset)
				}
				selection.addRange(range)
			})
		}, [state]),
		[state.components],
	)

	// // TODO: Drag-based scrolling (e.g. selected) jumps
	// //
	// // FIXME
	// React.useLayoutEffect(
	// 	React.useCallback(() => {
	// 		if (!state.focused) {
	// 			// No-op
	// 			return
	// 		}
	// 		const [pos1, pos2] = getCoords()
	// 		if (state.pos1.y !== state.pos2.y) {
	// 			// No-op
	// 			return
	// 		} else if (pos1.y < SCROLL_BUFFER) {
	// 			window.scrollBy(0, pos1.y - SCROLL_BUFFER)
	// 		} else if (pos2.y > window.innerHeight - SCROLL_BUFFER) {
	// 			window.scrollBy(0, pos2.y - window.innerHeight + SCROLL_BUFFER)
	// 		}
	// 	}, [state]),
	// 	[state.pos1, state.pos2],
	// )

	// Store the next undo -- debounced 500ms:
	React.useEffect(
		React.useCallback(() => {
			if (props.readOnly) {
				// No-op
				return
			}
			const id = setTimeout(() => {
				dispatch.storeUndo()
			}, 500)
			return () => {
				clearTimeout(id)
			}
		}, [dispatch, props.readOnly]),
		[state.components],
	)

	// Listen for shortcuts:
	React.useEffect(
		React.useCallback(() => {
			if (!state.props.shortcuts) {
				// No-op
				return
			}
			const onKeyDown = e => {
				if (detect.keyCode(e, KEY_CODE_1, { shiftKey: true })) {
					e.preventDefault()
					dispatch.setStylesheet("TYPE")
					return
				} else if (detect.keyCode(e, KEY_CODE_2, { shiftKey: true })) {
					e.preventDefault()
					dispatch.setStylesheet("MONO")
					return
				} else if (detect.keyCode(e, KEY_CODE_P)) {
					e.preventDefault()
					dispatch.toggleReadOnly()
					return
				}
			}
			document.addEventListener("keydown", onKeyDown)
			return () => {
				document.removeEventListener("keydown", onKeyDown)
			}
		}, [state, dispatch]),
		[state.props.shortcuts],
	)

	return (
		// <ErrorBoundary>
		<div style={{ fontSize: props.style && props.style.fontSize }}>
			{React.createElement(
				"div",
				{
					ref,

					className: `codex-editor ${state.featureClassName}`,

					style: {
						...{ ...props.style, fontSize: null },
						whiteSpace: "pre-wrap",
						outline: "none",
						overflowWrap: "break-word",
					},

					contentEditable: !state.props.readOnly,

					onFocus: dispatch.actionFocus,
					onBlur:  dispatch.actionBlur,

					onSelect: e => {
						// Guard the root node:
						const selection = document.getSelection()
						const range = selection.getRangeAt(0)
						if (range.startContainer === ref.current || range.endContainer === ref.current) {
							// Iterate to the innermost start node:
							let startNode = ref.current.childNodes[0]
							while (startNode.childNodes.length) {
								startNode = startNode.childNodes[0]
							}
							// Iterate to the innermost end node:
							let endNode = ref.current.childNodes[ref.current.childNodes.length - 1]
							while (endNode.childNodes.length) {
								endNode = endNode.childNodes[endNode.childNodes.length - 1]
							}
							// Reset the range:
							const range = document.createRange()
							range.setStart(startNode, 0)
							range.setEnd(endNode, (endNode.nodeValue || "").length)
							selection.removeAllRanges()
							selection.addRange(range)
						}
						const [pos1, pos2] = getPos(ref.current)
						dispatch.actionSelect(pos1, pos2)
						target.current = newNodeIterators()
					},

					onPointerDown: e => {
						pointerDown.current = true
					},

					onPointerMove: e => {
						if (!state.focused) {
							pointerDown.current = false
							return
						} else if (!pointerDown.current) {
							// No-op
							return
						}
						const [pos1, pos2] = getPos(ref.current)
						dispatch.actionSelect(pos1, pos2)
						target.current = newNodeIterators()
					},

					onPointerUp: e => {
						pointerDown.current = false
					},

					onKeyDown: e => {
						// Tab:
						if (!e.ctrlKey && e.keyCode === KEY_CODE_TAB) {
							e.preventDefault()
							dispatch.tab()
							return
						// Enter:
						} else if (e.keyCode === KEY_CODE_ENTER) {
							e.preventDefault()
							dispatch.enter()
							return
						// Undo:
						} else if (detect.undo(e)) {
							e.preventDefault()
							dispatch.undo()
							return
						// Redo:
						} else if (detect.redo(e)) {
							e.preventDefault()
							dispatch.redo()
							return
						}
					},

					onCompositionEnd: e => {
						// https://github.com/w3c/uievents/issues/202#issue-316461024
						dedupedCompositionEnd.current = true
						const { nodes, atEnd } = getNodesFromIterators(ref.current, target.current)
						const [pos1, pos2] = getPos(ref.current)
						dispatch.actionInput(nodes, atEnd, pos1, pos2)
					},

					onInput: e => {
						// https://github.com/w3c/uievents/issues/202#issue-316461024
						if (dedupedCompositionEnd.current) {
							dedupedCompositionEnd.current = false
							return
						} else if (e.nativeEvent.isComposing) {
							// No-op
							return
						}
						// https://w3.org/TR/input-events-2/#interface-InputEvent-Attributes
						switch (e.nativeEvent.inputType) {
						case "insertLineBreak":
						case "insertParagraph":
							dispatch.enter()
							return
							case "deleteContentBackward":
								dispatch.backspaceChar()
								return
							case "deleteWordBackward":
								dispatch.backspaceWord()
								return
							case "deleteSoftLineBackward":
							case "deleteHardLineBackward":
								dispatch.backspaceLine()
								return
							case "deleteContentForward":
								dispatch.backspaceCharForwards()
								return
							case "deleteWordForward":
								dispatch.backspaceWordForwards()
								return
						case "historyUndo":
							dispatch.undo()
							return
						case "historyRedo":
							dispatch.redo()
							return
						default:
							// No-op
							break
						}
						// Input:
						const { nodes, atEnd } = getNodesFromIterators(ref.current, target.current)
						const [pos1, pos2] = getPos(ref.current)
						dispatch.actionInput(nodes, atEnd, pos1, pos2)
					},

					onCut: e => {
						if (props.readOnly) {
							// No-op
							return
						}
						e.preventDefault()
						if (!state.selected) {
							// No-op
							return
						}
						const data = state.data.slice(state.pos1.pos, state.pos2.pos)
						e.clipboardData.setData("text/plain", data)
						dispatch.cut()
					},

					onCopy: e => {
						if (props.readOnly) {
							// No-op
							return
						}
						e.preventDefault()
						if (!state.selected) {
							// No-op
							return
						}
						const data = state.data.slice(state.pos1.pos, state.pos2.pos)
						e.clipboardData.setData("text/plain", data)
						dispatch.copy()
					},

					onPaste: e => {
						if (props.readOnly) {
							// No-op
							return
						}
						e.preventDefault()
						const data = e.clipboardData.getData("text/plain")
						if (!data) {
							// No-op
							return
						}
						dispatch.paste(data)
					},

					// TODO?
					onDrag: e => e.preventDefault(),
					onDrop: e => e.preventDefault(),
				},
			)}

			{/* Debugger */}
			{(false && process.env.NODE_ENV !== "production") && (
				<div className="py-6 whitespace-pre-wrap tabs-2 font-mono text-xs leading-snug text-black dark:text-white">
					{JSON.stringify(
						{
							...state,
							components: undefined,
							reactDOM:   undefined,
						},
						null,
						"\t",
					)}
				</div>
			)}

		</div>
		// </ErrorBoundary>
	)
}

// Export dependency:
export { default as useEditor } from "./useEditor"
