import path from 'path'
import { Telegraf, Markup } from 'telegraf'
require('dotenv').config()
const debugBot = require('debug')('debugBot')
import axios from 'axios'

import { readJSONfile } from '../utils/utility'
import { getTunnulURL } from '../utils/utility'

import { inlineKeyboardOne, inlineKeyboardTwo } from './buttons'

interface Post {
	article?: string
	image?: string
	title?: string
	caption?: string
	source?: string
	url: string
}
class Bot {
	bot: Telegraf
	botChatId: string
	channelChatId: string
	groupChatId: string

	constructor(token) {
		this.bot = new Telegraf(token)
		debugBot('Bot intialized successfully')
		const configs = readJSONfile(path.join(__dirname, '..', 'configs', 'botConfig.json'))
		this.botChatId = configs.botChatId
		this.channelChatId = configs.channelChatId
		this.groupChatId = configs.groupChatId
		this._registerCallbacks()
		this._getChatId()
	}

	sendToChannel(post: Post, image = null) {
		try {
			if (post.image) {
				this.bot.telegram.sendPhoto(this.channelChatId, post.image, {
					caption: this._prepareCaptionChannel(post),
					parse_mode: 'HTML',
				})
			} else if (image) {
				this.bot.telegram.sendPhoto(
					this.channelChatId,
					{ source: image },
					{
						caption: this._prepareCaptionChannel(post),
						parse_mode: 'HTML',
					}
				)
			} else if (!post.image) {
				this.bot.telegram.sendMessage(this.channelChatId, this._prepareCaptionChannel(post), {
					parse_mode: 'HTML',
				})
			}
			debugBot('Message sent to channel')
		} catch (error) {
			console.log(error)
			debugBot('Erorrrrrrr', error)
		}
	}
	sendToGroup(post: Post) {
		try {
			if (!post.image) {
				this.bot.telegram.sendPhoto(
					this.groupChatId,
					{ source: path.join(__dirname, 'img', 'nopic.jpg') },
					{
						caption: this._prepareCaptionGroup(post),
						reply_markup: inlineKeyboardTwo.reply_markup,
						parse_mode: 'HTML',
					}
				)
			} else {
				this.bot.telegram.sendPhoto(this.groupChatId, post.image, {
					caption: this._prepareCaptionGroup(post),
					reply_markup: inlineKeyboardOne.reply_markup,
					parse_mode: 'HTML',
				})
			}
			debugBot('Message sent to group')
		} catch (error) {
			console.log(error)
			debugBot('Erorrrrrrr', error)
		}
	}

	// call this method in the constructor
	_getChatId() {
		// for group and bot
		this.bot.command('/chatid', ctx => {
			ctx.reply(`Chat ID: ${ctx.chat.id}`)
		})
		// for channel
		this.bot.on('channel_post', ctx => {
			//@ts-ignore
			if (ctx.update.channel_post.text == '/chatid')
				ctx.reply(`Chat ID: ${ctx.update.channel_post.chat.id}`)
		})
	}

	// call this method in the constructor
	_registerCallbacks() {
		debugBot('registering callbacks')

		this.bot.action(['Ethiopian_Business_Daily', 'Send_Without_Image'], async ctx => {
			debugBot('Ethiopian_Business_Daily callback called')
			try {
				await ctx.answerCbQuery()
				await ctx.deleteMessage()
				const url = this._geturl(ctx) // get the news url from the caption of the message
				const news = (await axios.get(`${process.env.URL}/news?url=${url}`)).data.data[0]
				news.source = news.Source.name
				this.sendToChannel(news)
			} catch (error) {
				debugBot('Failed processing Ethiopian_Business_Daily callback', error)
			}
		})

		this.bot.action('remove', async ctx => {
			debugBot('remove callback called')
			try {
				await ctx.deleteMessage()
			} catch (error) {
				debugBot('Failed processing remove callback', error)
			}
		})

		this.bot.action('delete', async ctx => {
			debugBot('delete callback called')
			try {
				await ctx.answerCbQuery()
				await ctx.deleteMessage()
				const url = this._geturl(ctx) // get the news url from the caption of the message
				let id = (await axios.get(`${process.env.URL}/news?url=${url}`)).data.data[0]._id // get the id of the news
				await axios.delete(`${process.env.URL}/news/${id}`)
			} catch (error) {
				debugBot('Failed processing delete callback', error)
			}
		})

		this.bot.action(/.+/g, async ctx => {
			//@ts-ignore
			const callback = ctx.update.callback_query.data
			// get image name depending of the callback value
			const image = path.join(__dirname, 'img', `${callback}.jpg`)
			debugBot(`${callback}callback called`)
			try {
				await ctx.answerCbQuery()
				await ctx.deleteMessage()
				const url = this._geturl(ctx) // get the news url from the caption of the message
				const news = (await axios.get(`${process.env.URL}/news?url=${url}`)).data.data[0]
				news.source = news.Source.name
				this.sendToChannel(news, image)
			} catch (error) {
				debugBot('Failed processing Ethiopian_Business_Daily callback', error)
			}
		})
		debugBot('finished registering callback')
	}

	_prepareCaptionGroup(post: Post): string {
		let title
		post.title ? (title = post.title) : 'No Title'
		title = `<u><b>${title}</b></u>`

		let article = 'NO Article'
		if (post.article) {
			let count = 830 // the maximum media caption letter length
			let paragraphCount = 6
			let articleArray = post.article.split('$$$')
			while (count > 829) {
				paragraphCount--
				article = articleArray.slice(0, paragraphCount).join('\n')
				count = article.length
			}
		}

		let source = 'Via - NO source'
		if (post.source) {
			source = 'Via - ' + post.source
		}

		let url = 'NO url'
		if (post.url) {
			url = `<a href="${post.url}">READ MORE</a>`
		}

		let footer = `ስለ ቢዝነስ ብቻ የምንዘግብበትን\nSpecial Channel ተቀላቀሉ⬇️\n@Ethiopianbusinessdaily`

		let result = `${title}

		${article}
		
		${source}
		${url}

		${footer}`

		return result
	}
	_prepareCaptionChannel(post: Post): string {
		let title = ''
		if (post.title) {
			title = post.title
			title = `<u><b>${title}</b></u>`
		}

		if (!post.article) return
		let article
		let count = 830 // the maximum media caption letter length
		let paragraphCount = 6
		let articleArray = post.article.split('$$$')
		while (count > 829) {
			paragraphCount--
			article = articleArray.slice(0, paragraphCount).join('\n')
			count = article.length
		}

		let source = ''
		if (post.source) {
			source = 'Via - ' + post.source
		}

		let url = ''
		if (post.url) {
			url = `<a href="${post.url}">READ MORE</a>`
		}

		let footer = `ስለ ቢዝነስ ብቻ የምንዘግብበትን\nSpecial Channel ተቀላቀሉ⬇️\n@Ethiopianbusinessdaily`

		let result = `${title}

		${article}
		
		${source}
		${url}
		
		${footer}`

		return result
	}
	async launch(config: Telegraf.LaunchOptions = {}) {
		// if there is any previous registration of webhook on the telegram server, it must be cleared
		try {
			await this.bot.telegram.deleteWebhook()
			await this.bot.launch(config)
		} catch (error) {
			debugBot('Error Launching the bot', error)
		}
	}

	_geturl(ctx) {
		const message = ctx.update.callback_query.message
		//@ts-ignore
		const caption_entities = message.caption_entities
		let url = caption_entities.filter(el => el.url)[0].url
		return url
	}
	async configureWebhook() {
		await this.bot.telegram.deleteWebhook()
		debugBot('Inializing webhook configration')
		if (process.env.NODE_ENV === 'development') {
			try {
				const url = await getTunnulURL()
				// Set the bot API endpoint
				await this.bot.telegram.setWebhook(`${url}/${process.env.BOT_TOKEN}`)
				debugBot('Successfully webhook configured')
			} catch (error) {
				debugBot('Failed setting up webhook ', error)
			}
		} else if (process.env.NODE_ENV === 'production') {
			try {
				// Set the bot API endpoint
				await this.bot.telegram.setWebhook(`${process.env.URL}/${process.env.BOT_TOKEN}`)
				debugBot('Successfully webhook configured')
			} catch (error) {
				debugBot('Failed setting up webhook ', error)
			}
		}
	}
	registerBotHandler() {
		return this.bot.webhookCallback(`/${process.env.BOT_TOKEN}`)
	}
}

export default Bot
