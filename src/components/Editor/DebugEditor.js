import React from "react"
import stylex from "stylex"

const DebugEditor = props => (
	<pre style={{ ...stylex.parse("p-y:28 pre-wrap"), overflowWrap: "break-word" }}>
		<p style={{ MozTabSize: 2, tabSize: 2, font: "12px/1.375 Monaco" }}>
			{JSON.stringify(
				{
					// data: props.state.body.data,
					body: props.state.body,
					pos1: props.state.pos1,
					pos2: props.state.pos2,
				},
				null,
				"\t",
			)}
		</p>
	</pre>
)

export default DebugEditor
