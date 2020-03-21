// import getCoords from "./helpers/getCoords"
import getPosFromRange from "./helpers/getPosFromRange"
import getRangeFromPos from "./helpers/getRangeFromPos"
import innerText from "./helpers/innerText"
import NodeIterator from "./helpers/NodeIterator"
import React from "react"
import ReactDOM from "react-dom"
import syncTrees from "./helpers/syncTrees"
import useShortcuts from "./hooks/useShortcuts"
// import useUndo from "./hooks/useUndo"
import { newUUID } from "utils/random"

import {
	detectRedo,
	detectUndo,
} from "./helpers/platform"

/* purgecss start ignore */
import "./index.css"
/* purgecss end ignore */

// const SCROLL_BUFFER = 12

// Gets the cursors.
//
// TODO (1): Get pos1 and pos2 together
// TODO (2): Extract to helpers?
function getPos(rootNode) {
	const selection = document.getSelection()
	const range = selection.getRangeAt(0)
	const pos1 = getPosFromRange(rootNode, range.startContainer, range.startOffset)
	let pos2 = { ...pos1 }
	if (!range.collapsed) {
		pos2 = getPosFromRange(rootNode, range.endContainer, range.endOffset)
	}
	return [pos1, pos2]
}

// Creates a new start and end node iterator.
//
// TODO: Extract to helpers?
function newNodeIterators() {
	const selection = document.getSelection()
	const range = selection.getRangeAt(0)
	const { startContainer, endContainer } = range
	// Extend the target start (2x):
	const start = new NodeIterator(startContainer)
	while (start.count < 2 && start.getPrev()) {
		start.prev()
	}
	// Extend the target end (2x):
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
	// Re-extend the target start (1x):
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
			key = newUUID()
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

// const Debugger = ({ state, ...props }) => (
// 	<div className="mt-6 whitespace-pre-wrap tabs-2 font-mono text-xs leading-snug">
// 		{JSON.stringify(
// 			{
// 				// history: state.history,
//
// 				...state,
// 				components: undefined,
// 				reactDOM: undefined,
// 			},
// 			null,
// 			"\t",
// 		)}
// 	</div>
// )

export function Editor({
	state,
	dispatch,

	// Preferences:
	placeholder, // <String>
	fontSize,    // <CSS>

	// classNames:        "",
	// previewMode:       false,
	// // readOnly:       false,
	// // shortcuts:      false,
	// // whiteSpace:     false,
	// // wordWrap:       false,

	...props
}) {
	const ref = React.useRef()
	const target = React.useRef()

	// Extraneous refs:
	const pointerDown = React.useRef()
	const dedupedCompositionEnd = React.useRef()

	React.useLayoutEffect(
		React.useCallback(() => {
			ReactDOM.render(state.components, state.reactDOM, () => {
				// Sync the DOMs:
				//
				// NOTE: Force render on paste events because paste
				// can become a no-op (same data)
				const mutations = syncTrees(ref.current, state.reactDOM)
				if ((!state.shouldRender || !mutations) && state.actionType !== "PASTE") {
					dispatch.rendered()
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
				// NOTE: Use pos1 and pos2
				if (state.pos1.pos !== state.pos2.pos) {
					// TODO: Use state.pos1 as a shortcut
					const { node, offset } = getRangeFromPos(ref.current, state.pos2.pos)
					range.setEnd(node, offset)
				}
				selection.addRange(range)
				dispatch.rendered()
			})
		}, [state, dispatch]),
		[state.shouldRender],
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
	// 	[state.shouldRender /* before */, state.pos1, state.pos2],
	// )

	React.useEffect(
		React.useCallback(() => {
			// if (state.prefs.readOnly || state.prefs.previewMode) {
			// 	// No-op
			// 	return
			// }
			const id = setTimeout(() => {
				dispatch.storeUndo()
			}, 500)
			return () => {
				clearTimeout(id)
			}
		}, [dispatch]),
	[state.shouldRender])

	useShortcuts(state, dispatch)

	React.useEffect(() => {
		dispatch.getClassNames()
	}, [dispatch])

	return (
		<div style={{ fontSize }}>
			{React.createElement(
				"div",
				{
					ref,

					id: state.prefs.id || null,

					// TODO: Deprecate state.prefs.classNames
					className: ["codex-editor", ...state.prefs.classNames].join(" "),

					style: {
						...props.style, // Takes precedence
						whiteSpace: "pre-wrap",
						outline: "none",
						overflowWrap: "break-word",
					},

					contentEditable: !state.prefs.readOnly && !state.prefs.previewMode && true,
					suppressContentEditableWarning: !state.prefs.readOnly && !state.prefs.previewMode && true,

					onFocus: dispatch.actionFocus,
					onBlur:  dispatch.actionBlur,

					onSelect: e => {
						if (!state.focused) {
							// No-op
							return
						}
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
							pointerDown.current = false // Reset
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
						switch (true) {
						// Tab:
						case !e.ctrlKey && e.keyCode === 9: // Tab
							e.preventDefault()
							dispatch.tab()
							return
						// Enter:
						case e.keyCode === 13: // Enter
							e.preventDefault()
							dispatch.enter()
							return
						// Undo:
						case detectUndo(e):
							e.preventDefault()
							dispatch.undo()
							return
						// Redo:
						case detectRedo(e):
							e.preventDefault()
							dispatch.redo()
							return
						default:
							// No-op
							break
						}
					},

					onCompositionEnd: e => {
						// https://github.com/w3c/uievents/issues/202#issue-316461024
						dedupedCompositionEnd.current = true
						// Input:
						const { nodes, atEnd } = getNodesFromIterators(ref.current, target.current)
						const [pos1, pos2] = getPos(ref.current)
						dispatch.actionInput(nodes, atEnd, pos1, pos2)
					},
					onInput: e => {
						if (dedupedCompositionEnd.current) {
							dedupedCompositionEnd.current = false // Reset
							return
						}
						if (e.nativeEvent.isComposing) {
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
						case "deleteWordBackward": // FIXME/Chrome
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
						if (state.prefs.readOnly || state.prefs.previewMode) {
							// No-op
							return
						}
						e.preventDefault()
						if (!state.selected) {
							// No-op
							return
						}
						const substr = state.data.slice(state.pos1.pos, state.pos2.pos)
						e.clipboardData.setData("text/plain", substr)
						dispatch.cut()
					},
					onCopy: e => {
						if (state.prefs.readOnly || state.prefs.previewMode) {
							// No-op
							return
						}
						e.preventDefault()
						if (!state.selected) {
							// No-op
							return
						}
						const substr = state.data.slice(state.pos1.pos, state.pos2.pos)
						e.clipboardData.setData("text/plain", substr)
						dispatch.copy()
					},
					onPaste: e => {
						if (state.prefs.readOnly || state.prefs.previewMode) {
							// No-op
							return
						}
						e.preventDefault()
						const substr = e.clipboardData.getData("text/plain")
						if (!substr) {
							// No-op
							return
						}
						dispatch.paste(substr)
					},

					onDrag: e => e.preventDefault(),
					onDrop: e => e.preventDefault(),
				},
			)}
			{/* <Debugger state={state} /> */}
		</div>
	)
}

// Export dependency:
export { default as useEditor } from "./useEditor"
