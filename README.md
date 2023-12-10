<h1 align="center"> TAMU SHPE Mobile App</h1> <br>
<p align="center">
  <a href="">
    <img alt="SHPE Logo" title="SHPE" src="https://shpe.engr.ucr.edu/sites/default/files/styles/form_preview/public/SHPE_logo_IconOnly_FullColor-RGB_0.png?itok=_YzN6NAC" width="250">
  </a>
</p>

<p align="center">
  Your Famila, Our Mission.
</p>

## Introduction

The TAMU SHPE mobile application, designed for the Texas A&M University Chapter of the Society of Hispanic Professional Engineers, is a tool aimed at enhancing member interaction and engagement. This application brings together a host of features, each developed to streamline organizational processes and encourage community involvement.

Central to its functionality is an integrated Events and Point Management System that simplifies event coordination and tracks member participation. Its Committee Management feature streamlines the functioning of group activities.. The MemberSHPE Verification System ensures accurate membership identification.

Further enriching its capabilities, the app houses a Resume Bank, complete with verification processes to guarantee the integrity and confidentiality of professional documents. Additionally, the Test Bank offers an extensive array of study resources to aid members in their academic pursuits.

TAMU SHPE is build with react native, expo, typescript, firebase,

## Getting Started

### Dependencies

Various dependencies are required in order to test and build the application. The bare minimum required are the following:

- [Node.js][Node-url]
- [Yarn][Yarn-url]
- [Java 11][Java-url]
- iOS/Android emulator
  - The iOS emulator is only available on mac devices. The SDK can be installed via Xcode.
  - The Android emulator can be installed via [Android Studio] [Android-Studio-url].
- Internal Build (ios only)
  - A build created for internal use within the development team and can be downloaded on a developer's physical mobile device
  - see setup section to show how to create an internal build
  - Emulator not required

### Other dependencies

There are more dependencies that aren't necessarily required to run the application, but can be handy when testing:

- [Expo Go][Expo-Go-url]
  - App for testing on a physical mobile device. If you're running the app, make sure the device is connected to the same network as the development server device.
- [EAS][EAS-url]
  - Used for building application utilizing EAS Build which can host app binaries on the cloud
- [Tailwind CSS IntelliSense][Tailwind-url]
  - autocomplete for tailwind css
- [ngrok][ngrok-url]
  - Used for creating a secure tunnel when using `yarn start --tunnel`.
  - This is useful when developing on school wifi
- [React native snippets for VSCode][React-Native-Snippets-url]
  - These can be handy for generating boilerplate code for things like screens or components which repetitive templates.

## Setup

Once the basic dependencies are installed, you're almost ready to go. For the app to work as intended, create an [Expo Account][Expo-url]. Then, ask a repo maintainer for access to the project. This will allow push notifications to work correctly.

When your account has been added, open a terminal and navigate to the directory of the application. Afterwards, execute the following to install any node module dependencies:

```
$ yarn
```

Once finished, the application can be started using the following:

```
$ yarn start
```

There are other flags that must be added depending on how the app is being tested:

- `--tunnel` - This flag creates an ngrok tunnel that will run locally on your network
- `--go` - This flag launches an expo go server
- `--dev-client` - This flag launches a development server
- `--localhost` - This flag hosts the server locally instead of on LAN. This is useful when connecting and you don't have a network or are on public wifi and want to connect your physical phone via a cable.

There are various macros in `package.json` under the "scripts" key which can be used via `yarn <script-name>`. For example, `yarn go` will run `npx expo start --go`

Now that you know how to launch a server, there are multiple methods for development

### Method 1 - internal build **[Recommended for IOS]**

- Download the internal build provided by repo maintainer
- Run "yarn start"
- Scan QRCode provided by the server

### Method 2 - Emulator **[Recommended for Android]**

- Download the emulator
- Run "yarn build-android" or "yarn build-ios" at least once
- Run "yarn start"
- Press "a" or "i" to run on android or ios, respectively

### Method 3 - Expo App **[Recommended for quick setup]**

- Download Expo App
- Run "yarn go"
- Scan the QRCode provided by the server

## Deployment **[For Repo Maintainer]** - TODO: Need more details

To build using EAS, the following the documentation was used [here][EAS-url]. This will build and host the application on the cloud. EAS building will be required when deploying the app onto the Apple App Store and the Google Play Store.

```
$eas build
```

```
$eas submit
```

## Creating Internal Builds **[For Repo Maintainer]**

A build created for internal use within the development team and can be downloaded on a developer's physical mobile device.

Register a developer's Apple Device by running the command and provide them with the given QRCode. The QRCode must be scanned by developer and follow the instructions

```
$eas device:create
```

Create an Internal build by running the following script and provide the link to developer. You will be asked to select devices, select all device. It is important to note that an internal build must be created when a new developer (after eas device:create) and when a new dependencies/package is added.

```
yarn dev-client-sim
```

### Test - TODO: Need more details

```
$ yarn test
```

## Support

If you have any questions, please contact

Jason Le, vjasonle@gmail.com

Eliseo Garza, eliseogarza@tamu.edu

[Node-url]: https://nodejs.org/en/download
[Yarn-url]: https://classic.yarnpkg.com/lang/en/docs/install/#windows-stable
[ngrok-url]: https://ngrok.com/download
[Android-Studio-url]: https://developer.android.com/studio?gclid=CjwKCAjwkeqkBhAnEiwA5U-uM4C0y7a37MdCipZw33fmboKRKOAS8vgwCoPiRKLnEsEbUB2qRpS1YBoCBAcQAvD_BwE&gclsrc=aw.ds
[React-Native-Snippets-url]: https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets
[Expo-url]: https://expo.dev/
[Expo-Go-url]: https://expo.dev/client
[Java-url]: https://www.oracle.com/java/technologies/downloads/#java11
[EAS-url]: https://docs.expo.dev/build/introduction/
[Firebase-url]: https://firebase.google.com/
[React-Native-url]: https://reactnative.dev/
[Git-url]: https://git-scm.com/downloads
[Tailwind-url]: https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss
[Expo-Build-url]: https://expo.dev/accounts/tamu-shpe/projects/TAMU-SHPE/development-builds
[XCode-url]: https://apps.apple.com/us/app/xcode/id497799835
