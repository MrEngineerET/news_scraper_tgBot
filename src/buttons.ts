import path from 'path'
import { Markup } from 'telegraf'

import { readJSONfile } from '../utils/utility'

const buttons = readJSONfile(path.join(__dirname, '..', 'configs', 'buttons.json'))

let btn = buttons.btn
let btn4noImg = buttons.btn4noImg

btn = btn.map(line => {
	return line.map(el => {
		return Markup.button.callback(el.text, el.callback)
	})
})

btn4noImg = btn4noImg.map(line => {
	return line.map(el => {
		return Markup.button.callback(el.text, el.callback)
	})
})

export const inlineKeyboardOne = Markup.inlineKeyboard(btn)
export const inlineKeyboardTwo = Markup.inlineKeyboard(btn4noImg)
