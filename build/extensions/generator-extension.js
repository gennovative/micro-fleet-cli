"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuidv4 = require('uuid/v4');
module.exports = (toolbox) => {
    async function generateAuthSecret() {
        const firstPart = uuidv4().toString().toUpperCase().replace(/\-/g, '');
        const secondPart = uuidv4().toString().toUpperCase().replace(/\-/g, '');
        return firstPart.concat(secondPart);
    }
    toolbox.generator = { generateAuthSecret };
};
