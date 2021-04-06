/* eslint-disable @typescript-eslint/no-floating-promises */
// ts-expect-error `npm install express && npm install --save-dev @types/express`
import { Telegraf } from 'telegraf'
require('dotenv').config()
const debugBot = require('debug')('bot')

import { getTunnulURL } from '../utils/helper'

const token = process.env.BOT_TOKEN
if (token === undefined) {
	throw new Error('BOT_TOKEN must be provided!')
}

const bot = new Telegraf(token)
// Set the bot response
bot.on('text', async (ctx, next) => {
	const res = await ctx.replyWithHTML('<b>Hello</b>')
	return next()
})
bot.command('lala', ctx => {
	return ctx.reply('hellow biruk')
})
bot.start(ctx => {
	return ctx.reply('plsss work')
})
// Set telegram webhook
export function registerBotHandler(app) {
	if (process.env.NODE_ENV === 'development') {
		getTunnulURL().then(url => {
			// Set the bot API endpoint
			bot.telegram.setWebhook(`${url}/lalala`)
			app.use(bot.webhookCallback('/lalala'))
		})
	} else if (process.env.NODE_ENV === 'production') {
		bot.telegram.setWebhook(`${process.env.URL}/${process.env.BOT_TOKEN}`)
		app.use(bot.webhookCallback(`/${process.env.BOT_TOKEN}`))
	}
}
