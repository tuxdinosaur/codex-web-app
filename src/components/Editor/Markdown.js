import React from "react"
import stylex from "stylex"

const Syntax = stylex.Styleable(props => (
	<span style={stylex.parse("pre c:blue-a200")} {...props}>
		{props.children}
	</span>
))

const Markdown = ({ style, ...props }) => (
	<React.Fragment>
		{props.start && (
			<Syntax style={style} {...props}>
				{props.start}
			</Syntax>
		)}
		{props.children}
		{props.end && (
			<Syntax style={style} {...props}>
				{props.end}
			</Syntax>
		)}
	</React.Fragment>
)

export default Markdown