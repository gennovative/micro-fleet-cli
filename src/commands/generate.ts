import { GluegunToolbox } from 'gluegun'

module.exports = {
	name: 'generate',
	alias: ['g'],
	run: async (toolbox: GluegunToolbox) => {
		const {
			filesystem,
			// parameters,
			template: { generate },
			print: { info },
			prompt,
			system,
			generator,
		} = toolbox

		const ver = '1.0'
		let name = 'new-rest-api'
		let desc = ''
		let dbEngine = 'pg'
		let dbHost = 'localhost'
		let dbName = ''
		let dbUser = ''
		let dbPass = ''
		let accessTokenDuration = '1d'
		let webPort = '3000'
		let webURLPrefix = '/api/v1'
		let authSecret = await generator.generateAuthSecret()
		let authIssuer = ''
		let webCORS = ''

		const askName = {
			type: 'input',
			name: 'iName',
			message: `Enter the project name (default '${name}'): `
		}

		const askDesc = {
			type: 'input',
			name: 'iDesc',
			message: `Enter the project description: `
		}

		// const askDbName = {
		// 	type: 'input',
		// 	name: 'iDbName',
		// 	message: `Enter your database's name: `
		// }

		// const askDbUser = {
		// 	type: 'input',
		// 	name: 'iDbUser',
		// 	message: `Enter your database username: `
		// }

		// const askDbPass = {
		// 	type: 'password',
		// 	name: 'iDbPass',
		// 	message: `Enter your database password: `
		// }

		const {iName, iDesc} = await prompt.ask([askName, askDesc])

		// do {
		// 	let {iDbName} = await prompt.ask(askDbName)
		// 	dbName = iDbName
		// } while (!dbName)

		// do{
		// 	let {iDbUser} = await prompt.ask(askDbUser)
		// 	dbUser = iDbUser
		// } while (!dbUser)

		// do {
		// 	let {iDbPass} = await prompt.ask(askDbPass)
		// 	dbPass = iDbPass
		// } while (!dbPass)

		name = iName ? iName : name
		desc = iDesc ? iDesc : desc

		const runAuto = await prompt.confirm('Do you want to automatically install depedencies for the project?')

		await generate({
			template: 'package.json.ejs',
			target: `${name}/package.json`,
			props: { name, ver, desc }
		})

		await generate({
			template: 'appconfig.json.ejs',
			target: `${name}/appconfig.json`,
			props: { slugName: name, dbEngine, dbUser, dbPass, dbName, dbHost, authSecret, authIssuer, accessTokenDuration, webPort, webURLPrefix, webCORS }
		})

		await generate({
			template: 'server.ts',
			target: `${name}/server.ts`
		})
		
		await generate({
			template: 'README.md',
			target: `${name}/README.md`,
		})

		await generate({
			template: 'WelcomeController.ts.ejs',
			target: `${name}/src/app/controllers/WelcomeController.ts`,
		})

		if (runAuto) {
			const cmdOutput = await system.exec('npm i')
			info(cmdOutput)
		}

		info(`Generated REST API at ${filesystem.cwd()}/${name}`)
	}
}
