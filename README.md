# Micro-fleet CLI

Belongs to Micro Fleet framework, a CLI tool for generating REST service based on Micro Fleet framework.

## INSTALLATION

* Stable version: `npm i @micro-fleet/cli`
* Edge (development) version: `npm i git://github.com/gennovative/micro-fleet-cli.git`
* See [CHANGELOG.md](CHANGELOG.md) for more details about versions.

## HOW TO USE

- Manually create your project folder.

- `cd` to the project folder, execute `fleet` and answer questions

## DEVELOPMENT

### TRANSPILE CODE

- `npm run compile`: To lint then transpile TypeScript into JavaScript.
- `npm run tslint`: To check code-convention errors.
- `npm run watch`: To transpile without running unit tests, then watch for changes in *.ts files and re-transpile on save.

### RUN CLI LOCALLY FOR TESTING

- `yarn link` or `npm link` to make the tool globally accessible.
