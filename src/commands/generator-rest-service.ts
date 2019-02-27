import { GluegunToolbox } from 'gluegun'

module.exports = {
  name: 'generator-rest-service',
  run: async (toolbox: GluegunToolbox) => {
    const { print } = toolbox

    print.info('Welcome to your CLI')
  }
}
