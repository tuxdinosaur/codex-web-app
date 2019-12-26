const months = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
]

export const initialState = {
	chargeMonth: -1,
	nextMo:      { year: "(loading…)", month: "(loading…)", day: "(loading…)" },
	nextYr:      { year: "(loading…)", month: "(loading…)", day: "(loading…)" },
	info:        "",
	warn:        "",
	fetching:    false,
}

export const reducer = state => ({
	setNextMo(payload) {
		state.nextMo = { ...payload }
	},
	setNextYr(payload) {
		state.nextYr = { ...payload }
	},
	setChargeMo() {
		state.warn = ""
		state.chargeMonth = 1
		state.info = `You will be charged $8 today and then on ${months[state.nextMo.month]} ${state.nextMo.day}.`
	},
	setChargeYr() {
		state.warn = ""
		state.chargeMonth = 0
		state.info = `You will be charged $80 today and then on ${months[state.nextYr.month]} ${state.nextYr.day}, ${state.nextYr.year}.`
	},
	setInfo(info) {
		state.info = info
	},
	setWarn(warn) {
		state.warn = warn
	},
	setFetching(fetching) {
		state.fetching = fetching
	},
})