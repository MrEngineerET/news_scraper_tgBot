const localtunnel = require('localtunnel')
const debugTunnel = require('debug')('debugTunnel')
import fs from 'fs'

//read a json file and return the parsed json object
export function readJSONfile(location) {
	let doc = fs.readFileSync(location, {
		encoding: 'utf-8',
	})
	const file = JSON.parse(doc)
	return file
}

export async function getTunnulURL() {
	debugTunnel('Initiating tunneling ')
	const tunnel = await localtunnel({ port: 8080 })
	debugTunnel('Tunneling started at port 8080')

	// the assigned public url for your tunnel
	// i.e. https://abcdefgjhij.localtunnel.me
	tunnel.on('close', () => {
		debugTunnel('Closing tunneling')
	})
	return tunnel.url
}
