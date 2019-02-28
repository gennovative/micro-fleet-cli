"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const slugify_1 = require("slugify");
module.exports = {
    name: 'generator-rest-service',
    run: async (toolbox) => {
        const { filesystem, 
        // parameters,
        template: { generate }, print: { info }, prompt, system, generator, } = toolbox;
        const DEFAULTS = {
            version: '1.0.0',
            projectName: 'New REST API',
            description: 'An awesome REST service',
            webPort: 3000,
            webURLPrefix: '/api/v1',
            webCORS: '',
        };
        const projectInfo = await askProjectInfo(toolbox, DEFAULTS);
        // console.log({ projectInfo })
        const restInfo = await askWebInfo(toolbox, DEFAULTS);
        // console.log({ restInfo })
        const dbInfo = await askDatabase(toolbox, DEFAULTS);
        // const dbInfo: any = {} // await askDatabase(toolbox, DEFAULTS)
        // console.log({ dbInfo })
        const authInfo = await askAuth(toolbox, DEFAULTS);
        // console.log({ authInfo })
        const runAuto = await prompt.confirm('Do you want to automatically install depedencies for the project?');
        const projectSlug = slugify_1.default(projectInfo.pjName, { lower: true });
        const prepareTpl = prepareTplFactory(projectSlug);
        await generate(Object.assign({}, prepareTpl('appconfig.json.ejs'), { props: {
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
            } }));
        await generate(Object.assign({}, prepareTpl('package.json.ejs'), { props: {
                projectName: projectInfo.pjName,
                projectVersion: projectInfo.pjVersion,
                projectDesc: projectInfo.pjDescription,
            } }));
        await generate(Object.assign({}, prepareTpl('README.md.ejs')));
        await generate(Object.assign({}, prepareTpl('src/app/server.ts.ejs')));
        await generate(Object.assign({}, prepareTpl('src/app/controllers/WelcomeController.ts.ejs')));
        await generate(Object.assign({}, prepareTpl('src/app/models/model.ts.ejs')));
        if (runAuto) {
            const cmdOutput = await system.exec('npm i');
            info(cmdOutput);
        }
        info(`Generated REST API at ${filesystem.cwd()}/${projectSlug}`);
    },
};
function prepareTplFactory(projectName) {
    return function (tplPath) {
        const filename = path.basename(tplPath);
        const dirPath = path.dirname(tplPath);
        return {
            template: tplPath,
            target: path.join(projectName, dirPath, filename.replace(/(.*).ejs$/i, '$1')),
        };
    };
}
async function askProjectInfo({ prompt }, DEFAULTS) {
    const askName = {
        type: 'input',
        name: 'pjName',
        message: 'Project name',
        default: DEFAULTS.projectName,
    };
    const askDesc = {
        type: 'input',
        name: 'pjDescription',
        message: 'Project description',
        default: DEFAULTS.description,
    };
    const askVer = {
        type: 'input',
        name: 'pjVersion',
        message: 'Project version',
        default: DEFAULTS.version,
    };
    const answer = await prompt.ask([askName, askDesc, askVer]);
    return answer;
}
async function askWebInfo({ prompt }, DEFAULTS) {
    const askPort = {
        type: 'input',
        name: 'restPort',
        message: 'HTTP port to listen',
        default: DEFAULTS.webPort,
    };
    const askPrefix = {
        type: 'input',
        name: 'restPathPrefix',
        message: 'API URL path prefix',
        default: DEFAULTS.webURLPrefix,
    };
    const answer = await prompt.ask([askPort, askPrefix]);
    return answer;
}
async function askDatabase({ prompt }, DEFAULTS) {
    let dbInfo = {
        hasDatabase: false,
    };
    const hasDatabase = await prompt.confirm('Does this service connect to database?');
    if (!hasDatabase) {
        return dbInfo;
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
    };
    const askDbHost = {
        type: 'input',
        name: 'dbHost',
        message: 'Database host',
    };
    const askDbPort = {
        type: 'input',
        name: 'dbPort',
        message: 'Database port',
    };
    const askDbUser = {
        type: 'input',
        name: 'dbUsername',
        message: 'Database username',
    };
    const askDbPass = {
        type: 'password',
        name: 'dbPassword',
        message: 'Database password',
    };
    const askDbName = {
        type: 'input',
        name: 'dbName',
        message: 'Database name',
        validate: val => (val ? true : 'This detail is required'),
    };
    const answers = await prompt.ask([
        askDbEngine,
        askDbHost,
        askDbPort,
        askDbUser,
        askDbPass,
        askDbName,
    ]);
    dbInfo = Object.assign({}, answers, { hasDatabase: true });
    return dbInfo;
}
async function askAuth({ prompt, generator }, DEFAULTS) {
    let authInfo = {
        hasAuth: false,
    };
    const hasAuth = await prompt.confirm('Does this service authenticate with OAuth?');
    if (!hasAuth) {
        return authInfo;
    }
    const keygenAns = await prompt.ask({
        type: 'select',
        name: 'shouldGenerateKey',
        message: 'Where to get the key?',
        initial: true,
        choices: [
            { message: 'Generate a key for me', name: 'auto' },
            { message: 'I\'m giving the key', name: 'manual' },
        ],
    });
    let authSecret;
    if (keygenAns.shouldGenerateKey == 'auto') {
        authSecret = await generator.generateAuthSecret();
    }
    else {
        const secretAns = await prompt.ask({
            type: 'input',
            name: 'authSecret',
            message: 'Enter secret key',
            validate: val => (val ? true : 'This detail is required!'),
        });
        authSecret = secretAns.secret;
    }
    const askIssuer = {
        type: 'input',
        name: 'authIssuer',
        message: 'Issuer',
    };
    const askExpiration = {
        type: 'input',
        name: 'authAccessExpire',
        message: 'Expired after (e.g: 30m, 1d)',
        validate: val => (val ? true : 'This detail is required!'),
    };
    const answers = await prompt.ask([
        askIssuer,
        askExpiration,
    ]);
    authInfo = Object.assign({}, answers, { authSecret, hasAuth: true });
    return authInfo;
}
