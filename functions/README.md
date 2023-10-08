# Cloud Functions

Firebase Cloud Functions, sometimes referred to as just "functions", are pieces of code that will be executed on a Firebase server instead of in the mobile application. These are very useful whenever there are tasks that either need to be done periodically or require higher level permissions that a user does not have by default.

Note: Because this is separate from the Mobile App, please do not mix any code here with the app itself. Any exports or imports to/from the app could cause dependency-coupling. Functions should be entirely detached from the main app.
