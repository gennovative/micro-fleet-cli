# Micro Fleet - RESTful web service for Membership

Exposes RESTful APIs to work with accounts and roles.

---
## INSTALLATION

`npm i`: To install dependencies.
`gulp` to transpile TypeScript.

## TEST

- Execute `npm start` to start web server.
- Send a GET request to `http://localhost:3000/` to check if it works.

## DEVELOPMENT

- `npm run build` to transpile TypeScript then run unit tests (if any) (equiv. `npm run compile` + `npm run test` (if any)).
- `npm run compile`: To transpile TypeScript into JavaScript.
- `npm run watch`: To transpile without running unit tests, then watch for changes in *.ts files and re-transpile on save.
- `npm run test`: To run unit tests.
  * After tests finish, open file `/coverage/index.html` with a web browser to see the code coverage report which is mapped to TypeScript code.

## RELEASE

- Jump to script folder: `cd ./docker`
- Create Docker image: `sudo sh ./create-image.sh`
- Deploy services to Docker swarm: `sudo sh ./deploy.sh`
- Remove services from Docker swarm: `sudo sh ./undeploy.sh`