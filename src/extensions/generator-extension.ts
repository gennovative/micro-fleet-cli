import { GluegunToolbox } from 'gluegun'

const uuidv4 = require('uuid/v4')


module.exports = (toolbox: GluegunToolbox) => {
    async function generateAuthSecret(): Promise<string> {
        const firstPart: string = uuidv4().toString().toUpperCase().replace(/\-/g, '')
        const secondPart: string = uuidv4().toString().toUpperCase().replace(/\-/g, '')
        return firstPart.concat(secondPart)
    }

    toolbox.generator = { generateAuthSecret }
}
