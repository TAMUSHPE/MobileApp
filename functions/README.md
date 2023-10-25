# Cloud Functions

Firebase Cloud Functions, sometimes referred to as just "functions", are pieces of code that will be executed on a Firebase server instead of in the mobile application. These are very useful whenever there are tasks that either need to be done periodically or require higher level permissions that a user does not have by default.

Note: Because this is separate from the Mobile App, please do not mix any code here with the app itself. Any exports or imports to/from the app could cause dependency-coupling. Functions should be entirely detached from the main app.

## Dependencies

In order to develop functions, certain dependencies are required to be installed. To install the Firebase Command Line Interface (CLI), enter the following command in to your console:

```bash
$ npm install -g firebase-tools
```

Once you have installed the CLI, in this directory `./functions` use the following to install any local node dependencies:

```bash
$ npm install
```

Once these have been installed, you're ready to develop!

## Deployment

When you are ready to deploy your functions to Firebase, you can use the following command to deploy **all** of the functions (Make sure your terminal is in the `./functions` directory):

```bash
$ firebase deploy --only functions

or

$ npm run deploy 
```

To deploy a specific function (for example: `myFunction`), you can use the following:

```bash
$ firebase deploy --only functions:myFunction
```

Note: Before deployment, functions are put through a linter to ensure code style quality. This means deployment will throw errors if things like unused functions/variables are present in the code. 

## Testing

Testing in production is usually a bad idea. Because of this, you can set up a test server by using the following:

```bash
$ tsc
$ firebase emulators:start --only functions

or

$ npm run serve
```

This will host a local server in which you can test the functions. Other services like firestore, auth, and storage need to be set up separately. More can be found here: https://firebase.google.com/docs/emulator-suite/install_and_configure