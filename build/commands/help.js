// import { GluegunToolbox } from 'gluegun'
module.exports = {
    name: 'help',
    alias: ['g'],
    run: async (toolbox) => {
        const { print } = toolbox;
        print.info('Gennova CLI for backend REST service');
    },
};
