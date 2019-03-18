import * as path from 'path'

import { GluegunToolbox, filesystem } from 'gluegun'
import slugify from 'slugify'

type ExtToolbox  = GluegunToolbox & {
    generator: any,
}

type TemplateInfo = {
    template: string,
    target: string,
}

type ProjectInfo = {
    pjName?: string,
    pjDescription?: string,
    pjVersion?: string,
}

type RestInfo = {
    restPort?: number,
    restPathPrefix?: string,
}

type DatabaseInfo = {
    hasDatabase: boolean,
    dbEngine?: string,
    dbHost?: string,
    dbPort?: number,
    dbUsername?: string,
    dbPassword?: string,
    dbName?: string,
}

type AuthInfo = {
    hasAuth: boolean,
    authSecret?: string,
    authIssuer?: string,
    authExpireAccess?: number,
}

const {exec} = require('child_process')
const argv = require('yargs')
    .argv

const SRC_DIR = 'src/app'
const CONTROLLERS_DIR = `${SRC_DIR}/controllers`
const MODELS_DIR = `${SRC_DIR}/models`

module.exports = {
    name: 'micro-fleet-cli',
    run: async (toolbox: ExtToolbox) => {
        const {
            filesystem,
            parameters,
            template: { generate },
            print: { info },
            prompt,
            system,
            generator,
        } = toolbox

        const DEFAULTS = {
            version: '1.0.0',
            projectName: 'New REST API',
            description: 'An awesome REST service',
            webPort: 3000,
            webURLPrefix: '/api/v1',
            webCORS: '',
        }

        const {} = parameters.options
        const {database, d, b, 'web-port': webPort, p, auth} = argv
        const db = (d && b) ? b : null
        const restPortFromOption: number = (webPort || p) ? (webPort ? webPort : p) : null

        const dbInfoFromOption: DatabaseInfo = (database || db) ? (database ? readDBOption(database) : readDBOption(db)) : null

        const projectInfo: ProjectInfo = await askProjectInfo(toolbox, DEFAULTS)

        const restInfo: RestInfo = await askWebInfo(toolbox, DEFAULTS, restPortFromOption)

        const dbInfo: DatabaseInfo = dbInfoFromOption ? dbInfoFromOption : await askDatabase(toolbox, DEFAULTS)

        const authInfo: AuthInfo = await askAuth(toolbox, DEFAULTS)

        const runAuto = await prompt.confirm('Do you want to automatically install depedencies for this project?')

        const projectSlug = slugify(projectInfo.pjName, { lower: true })
        const prepareTpl = prepareTplFactory(projectSlug)

        const dbAddon = dbInfo.hasDatabase ? `\n\t\tthis.attachAddOn(registerDbAddOn());\n` : ``

        await generate({
            ...prepareTpl('appconfig.json.ejs'),
            props: {
                slugName: projectSlug,

                hasDatabase: dbInfo.hasDatabase,
                dbEngine: dbInfo.dbEngine,
                dbHost: dbInfo.dbHost,
                dbPort: dbInfo.dbPort,
                dbUser: dbInfo.dbUsername,
                dbPass: dbInfo.dbPassword,
                dbName: dbInfo.dbName,

                hasAuth: authInfo.hasAuth,
                authSecret: authInfo.authSecret,
                authIssuer: authInfo.authIssuer,
                authAccessExpire: authInfo.authExpireAccess,

                webPort: restInfo.restPort,
                webURLPrefix: restInfo.restPathPrefix,
            },
        })

        await generate({
            ...prepareTpl('package.json.ejs'),
            props: {
                projectName: projectSlug,
                projectVersion: projectInfo.pjVersion,
                projectDesc: projectInfo.pjDescription,
            },
        })

        await generate({
            ...prepareTpl('README.md.ejs'),
        })

        await generate({
            ...prepareTpl(`${SRC_DIR}/server.ts.ejs`),
            props: {dbAddon},
        })

        await generate({
            ...prepareTpl(`${CONTROLLERS_DIR}/WelcomeController.ts.ejs`),
        })
        await addControllerToIndex('Welcome')

        await generate({
            ...prepareTpl(`${CONTROLLERS_DIR}/index.ts.ejs`),
        })

        // await generate({
        //     ...prepareTpl(`${MODELS_DIR}/model.ts.ejs`),
        // })

        if (runAuto) {
            const generatedDir = `${process.cwd()}/${projectSlug}/`
            process.chdir(generatedDir)
            exec(`npm i`, (err, stdout, stderr) => {
                if (err) {
                    console.error(err)
                }
                console.log(stdout)
            })
        }

        info(`REST API generated at ${filesystem.cwd()}/${projectSlug}`)
    },
}

function prepareTplFactory(projectName) {
    return function (tplPath) {
        const filename = path.basename(tplPath)
        const dirPath = path.dirname(tplPath)
        return {
            template: tplPath,
            target: path.join(projectName, dirPath, filename.replace(/(.*).ejs$/i, '$1')),
        }
    }
}

function readDBOption(optionInput: string): DatabaseInfo {
    const checkRegex = /^(pg|mysql)+@[\w-]+:[\w-]+@[\w-]+:\d+\/[\w-]+$/

    if (checkRegex.test(optionInput)) {
        return {
            hasDatabase: true,
            dbEngine: optionInput.split(/@/)[0],
            dbUsername: optionInput.split(/@/)[1].split(/:/)[0],
            dbPassword: optionInput.split(/@/)[1].split(/:/)[1],
            dbHost: optionInput.split(/@/)[2].split(/:/)[0],
            dbPort: Number(optionInput.split(/@/)[2].split(/:/)[1].split(/\//)[0]),
            dbName: optionInput.split(/@/)[2].split(/:/)[1].split(/\//)[1],
        }
    }
    else return null
}

async function addControllerToIndex(controllerName: string): Promise<any> {
    controllerName = controllerName.concat('Controller')
    const strToAppend: string = `export { default as ${controllerName} } from './${controllerName}'\n`
    const indexTplPath: string = __dirname.replace(/(commands)$/, `templates/${CONTROLLERS_DIR}/index.ts.ejs`)
    const templateContent: string = await filesystem.readAsync(indexTplPath)

    if (templateContent.indexOf(controllerName) == -1) filesystem.append(indexTplPath, strToAppend)
}

async function askProjectInfo({ prompt }: ExtToolbox, DEFAULTS): Promise<ProjectInfo> {
    const askName = {
        type: 'input',
        name: 'pjName',
        message: 'Project name',
        default: DEFAULTS.projectName,
    }

    const askDesc = {
        type: 'input',
        name: 'pjDescription',
        message: 'Project description',
        default: DEFAULTS.description,
    }

    const askVer = {
        type: 'input',
        name: 'pjVersion',
        message: 'Project version',
        default: DEFAULTS.version,
    }

    const answer = await prompt.ask([askName, askDesc, askVer]) as ProjectInfo
    return answer
}

async function askWebInfo({ prompt }: ExtToolbox, DEFAULTS, portFromOption: number): Promise<RestInfo> {
    const askPort = {
        type: 'input',
        name: 'restPort',
        message: 'HTTP port to listen',
        default: DEFAULTS.webPort,
    }

    const askPrefix = {
        type: 'input',
        name: 'restPathPrefix',
        message: 'API URL path prefix',
        default: DEFAULTS.webURLPrefix,
    }

    const askPrefixOnly = await prompt.ask([askPrefix])
    // tslint:disable-next-line:max-line-length
    return portFromOption ? {restPort: portFromOption, restPathPrefix: askPrefixOnly.restPathPrefix} : await prompt.ask([askPort, askPrefix]) as RestInfo
}

async function askDatabase({ prompt }: ExtToolbox, DEFAULTS): Promise<DatabaseInfo> {
    let dbInfo: DatabaseInfo = {
        hasDatabase: false,
    }

    const hasDatabase = await prompt.confirm('Does this service connect to a database?')
    if (!hasDatabase) {
        return dbInfo
    }

    const askDbEngine = {
        type: 'select',
        name: 'dbEngine',
        message: 'Database engine',
        choices: [
            { name: 'Postgresql', value: 'pg' },
            { name: 'MySQL', value: 'mysql' },
            { name: 'MongoDB', message: '(Coming soon)', value: 'mongo', disabled: true },
        ],
    }

    const askDbHost = {
        type: 'input',
        name: 'dbHost',
        message: 'Database host',
    }

    const askDbPort = {
        type: 'input',
        name: 'dbPort',
        message: 'Database port',
    }

    const askDbUser = {
        type: 'input',
        name: 'dbUsername',
        message: 'Database username',
    }

    const askDbPass = {
        type: 'password',
        name: 'dbPassword',
        message: 'Database password',
    }

    const askDbName = {
        type: 'input',
        name: 'dbName',
        message: 'Database name',
        validate: val => (val ? true : 'This detail is required'),
    }

    const answers = await prompt.ask([
        askDbEngine,
        askDbHost,
        askDbPort,
        askDbUser,
        askDbPass,
        askDbName,
    ])

    dbInfo = {
        ...answers,
        hasDatabase: true,
    }

    return dbInfo
}

async function askAuth({ prompt, generator }: ExtToolbox, DEFAULTS): Promise<AuthInfo> {
    let authInfo: AuthInfo = {
        hasAuth: false,
    }

    const hasAuth = await prompt.confirm('Does this service authenticate with OAuth?')
    if (!hasAuth) {
        return authInfo
    }

    const keygenAns = await prompt.ask(<any>{
        type: 'select',
        name: 'shouldGenerateKey',
        message: 'Where to get the key?',
        initial: true,
        choices: [
            { message: 'Generate a key for me', name: 'auto' },
            { message: 'I\'m giving the key', name: 'manual' },
        ],
    })

    let authSecret
    if (keygenAns.shouldGenerateKey == 'auto') {
        authSecret = await generator.generateAuthSecret()
    }
    else {
        const secretAns = await prompt.ask(<any>{
            type: 'input',
            name: 'authSecret',
            message: 'Enter secret key',
            validate: val => (val ? true : 'This detail is required!'),
        })
        authSecret = secretAns.secret
    }

    const askIssuer = {
        type: 'input',
        name: 'authIssuer',
        message: 'Issuer',
    }

    const askExpiration = {
        type: 'input',
        name: 'authAccessExpire',
        message: 'Expired after (e.g: 30m, 1d)',
        validate: val => (val ? true : 'This detail is required!'),
    }

    const answers = await prompt.ask([
        askIssuer,
        askExpiration,
    ])

    authInfo = {
        ...answers,
        authSecret,
        hasAuth: true,
    }

    return authInfo
}
