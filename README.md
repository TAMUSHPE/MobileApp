<a name="readme-top"></a>

[![Contributors][contributors-shield]][contributors-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]

<h1 align="center"> SHPE Mobile App</h1> <br>
<p align="center">
  <a href="">
    <img alt="SHPE Logo" title="SHPE" src="https://shpe.engr.ucr.edu/sites/default/files/styles/form_preview/public/SHPE_logo_IconOnly_FullColor-RGB_0.png?itok=_YzN6NAC" width="250">
  </a>
</p>

<p align="center">
  Your Famila, Our Mission.
</p>

<p align="center">
  <a href="">
    <img alt="Download on the App Store" title="App Store" src="https://assets.stickpng.com/images/5a902db97f96951c82922874.png" width="140" height="50">
  </a>
  <a href="">
    <img alt="Download on the App Store" title="Play Store" src="https://cdn.freebiesupply.com/logos/large/2x/google-play-badge-logo-png-transparent.png" width="140" height="50">
  </a>
</p>

## About The Project

We are excited to introduce our mobile app project for the Society of Hispanic Professional Engineers (SHPE). This app aims to serve as an information hub and a valuable resource for our members. With a focus on enhancing member engagement and providing access to important resources, the app will play a pivotal role in connecting and empowering our familia.

### Built With

- [![React][React.js]][React-url]

## Table of Contents

1. [Getting Started](#getting-started)
    - [Dependencies](#dependencies)
    - [Setup](#setup)
2. [Usage](#usage)
3. [Contact](#contact)

## Getting Started

### Dependencies

Various dependencies are required in order to test and build the application. The bare minimum required are the following:

- [Node.js][Node-url]
- [Yarn][Yarn-url]
- [ngrok][ngrok-url]
- [Java 11][Java-url] (Oracle JDK)
- iOS/Android emulator
    - The iOS emulator is only available on mac devices. The SDK can be   installed via Xcode.
    - The Android emulator can be installed via [Android Studio]  [Android-Studio-url].

Any extra information about environment setup can be found [here](https://reactnative.dev/docs/environment-setup).

There are more dependencies that aren't necessarily required to run the application, but can be handy when testing:

- [Expo Go][Expo-Go-url]
    - App for testing on a physical mobile device. If you're running the app, make sure the device is connected to the same network as the development server device.
- [React native snippets for VSCode][React-Native-Snippets-url]
    - These can be handy for generating boilerplate code for things like screens or components which repetitive templates.
- [EAS][EAS-url]
    - Used for building application utilizing EAS Build which can host app binaries on the cloud

### Setup

Once the basic dependencies are installed, you're almost ready to go. First, open a terminal and navigate to the directory of the application. Afterwards, execute the following to install any node module dependencies:

```
$ yarn
```

Once finished, the application can be started using `yarn start` or one of the following:

```
$ npx expo start                # Default method
      or
$ npx expo start --tunnel       # For Windows
      or
$ npx expo start --dev-client   # Hosts on development server
```

There are also various macros in `package.json` under the "scripts" key which can be used via `yarn <script-name>`.

There are two main ways to build the application: locally and with EAS. To build locally onto an emulator, simple execute the following:

```
$ npx expo run:android
      or
$ npx expo run:ios
```

These can also be run using `yarn build-android` or `yarn build-ios`.

To build using EAS, carefully follow the documentation stated [here][EAS-url]. This will build and host the application on the cloud.

## Usage

## Contact

If you have any questions, please contact

Jason Le, JasonIsAzn@tamu.edu

Eliseo Garza, eliseogarza@tamu.edu

<p align="right">(<a href="#readme-top">back to top</a>)</p>

[contributors-shield]: https://img.shields.io/github/contributors/github_username/repo_name.svg?style=for-the-badge
[contributors-url]: https://github.com/TAMUSHPE/MobileApp/graphs/contributors
[stars-shield]: https://img.shields.io/github/stars/github_username/repo_name.svg?style=for-the-badge
[stars-url]: https://github.com/TAMUSHPE/MobileApp/stargazers
[issues-shield]: https://img.shields.io/github/issues/github_username/repo_name.svg?style=for-the-badge
[issues-url]: https://github.com/TAMUSHPE/MobileApp/issues
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/linkedin_username
[product-screenshot]: images/screenshot.png
[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[Vue.js]: https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vuedotjs&logoColor=4FC08D
[Vue-url]: https://vuejs.org/
[Angular.io]: https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white
[Angular-url]: https://angular.io/
[Svelte.dev]: https://img.shields.io/badge/Svelte-4A4A55?style=for-the-badge&logo=svelte&logoColor=FF3E00
[Svelte-url]: https://svelte.dev/
[Laravel.com]: https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white
[Laravel-url]: https://laravel.com
[Bootstrap.com]: https://img.shields.io/badge/Bootstrap-563D7C?style=for-the-badge&logo=bootstrap&logoColor=white
[Bootstrap-url]: https://getbootstrap.com
[JQuery.com]: https://img.shields.io/badge/jQuery-0769AD?style=for-the-badge&logo=jquery&logoColor=white
[JQuery-url]: https://jquery.com
[Node-url]: https://nodejs.org/en/download
[Yarn-url]: https://classic.yarnpkg.com/lang/en/docs/install/#windows-stable
[ngrok-url]: https://ngrok.com/download
[Android-Studio-url]: https://developer.android.com/studio?gclid=CjwKCAjwkeqkBhAnEiwA5U-uM4C0y7a37MdCipZw33fmboKRKOAS8vgwCoPiRKLnEsEbUB2qRpS1YBoCBAcQAvD_BwE&gclsrc=aw.ds
[React-Native-Snippets-url]: https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets
[Expo-Go-url]: https://expo.dev/client
[Java-url]: https://www.oracle.com/java/technologies/downloads/#java11
[EAS-url]: https://docs.expo.dev/build/introduction/
