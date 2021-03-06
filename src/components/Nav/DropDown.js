import $Link from "components/Link"
import React from "react"

export const Separator = props => (
	<hr className="-mx-px my-2 border-gray-300 dark:border-gray-650" />
)

export const Link = props => (
	// NOTE: Use md-blue-a200 for light mode; md-blue-a400 has
	// too much contrast
	//
	// eslint-disable-next-line react/jsx-pascal-case
	<$Link className="-mx-px px-4 py-1 text-black dark:text-white hover:text-white hover:bg-md-blue-a200" {...props}>
		<p className="font-medium -text-px">
			{props.children}
		</p>
	</$Link>
)

export const Base = React.forwardRef((props, ref) => (
	<div ref={ref} className="-mt-2 absolute right-0 top-full w-48 bg-white dark:bg-gray-750 rounded-lg shadow-hero-lg">
		{/* NOTE: Use py-2 because Link uses py-1 */}
		<div className="py-2 border border-transparent dark:border-gray-700 rounded-lg dark:shadow-hero-lg">
			{props.children}
		</div>
	</div>
))
