import * as constants from "__constants"
import * as DropDown from "./DropDown"
import * as Icons from "svgs"
import * as User from "components/User"
import firebase from "firebase/app"
import Icon from "utils/Icon"
import Link from "components/Link"
import NavButtonDarkMode from "./NavButtonDarkMode"
import React from "react"
import useDropDown from "hooks/useDropDown"
import useTransitionNav from "./useTransitionNav"

const Nav = props => {
	const ref = React.useRef()

	const user = User.useUser()
	const [dropDown, setDropDown] = useDropDown(ref)

	const handleClickSignOut = e => {
		const ok = window.confirm("Are you sure you want logout?")
		if (!ok) {
			// No-op
			return
		}
		firebase.auth().signOut().catch(err => {
			console.warn(err)
		})
	}

	return (
		<React.Fragment>

			{/* LHS */}
			<div className="-mx-3 flex flex-row">

				{/* Logo */}
				<Link className="px-3 flex flex-row items-center" to={constants.PATH_HOME}>
					{/* NOTE: Use p-px to match the perceived size of
					the user photo */}
					<Icon className="p-px w-8 h-8 text-md-blue-a400 dark:text-md-blue-a200" svg={Icons.CodexLogo} />
				</Link>

				{/* Save status -- for <UserNote> */}
				<div className="px-3 flex flex-row items-center">
					{/* NOTE: Use tracking-px instead of tracking-wide */}
					<p id="user-note-save-status" className="text-md-gray-500 tracking-px" />
				</div>

			</div>

			{/* RHS */}
			<div className="-mx-3 flex flex-row">

				<NavButtonDarkMode />

				<div className="px-3 relative flex flex-row items-center">

					{/* Button */}
					<button className="bg-gray-100 dark:bg-gray-850 rounded-full focus:outline-none focus:shadow-outline overflow-hidden transition duration-150 ease-in-out" onPointerDown={e => e.preventDefault()} onClick={e => setDropDown(!dropDown)}>
						<img className="w-8 h-8" src={user.photoURL || constants.TRANSPARENT_PX} alt="" />
					</button>

					{/* Drop down */}
					<DropDown.Base ref={ref}>
						<DropDown.Link
							to={constants.PATH_NEW_NOTE}
							children="Create a new note"
						/>
						<DropDown.Link
							to={constants.PATH_MY_NOTES}
							children="My notes"
						/>
						<DropDown.Separator />
						<DropDown.Link
							to={constants.PATH_README}
							children="Readme"
						/>
						<DropDown.Link
							to={constants.PATH_CHANGELOG}
							children="Changelog"
						/>
						<DropDown.Link
							to={constants.URL_GITHUB_REPO}
							children="GitHub"
						/>
						<DropDown.Separator />
						<DropDown.Link
							onClick={handleClickSignOut}
							children="Logout"
						/>
					</DropDown.Base>

				</div>

			</div>

		</React.Fragment>
	)
}

const AuthNav = props => {
	const ref = React.useRef()

	useTransitionNav(ref)

	return (
		<div ref={ref} className="fixed inset-x-0 top-0 flex flex-row justify-center bg-white dark:bg-gray-900 border-b border-transparent dark:border-gray-750 shadow z-30 transition duration-300">
			<div className="px-6 flex flex-row justify-between w-full max-w-screen-lg" style={{ height: "3.5rem" /* h-14 */ }}>
				<Nav />
			</div>
		</div>
	)
}

export default AuthNav
