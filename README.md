# TxtNotes

This application displays notes from text files in a mobile friendly format using the JQuery Mobile framework. Project requirements were:

- display plain text files that use double line breaks between note fields
- make note files easily searchable and filterable
- run as a Chrome packaged app
- run on Android
- sync files using Google drive
- allow text files to be viewed and edited independent of application

I used these requirements to learn more about JQuery Mobile, Chrome packaged apps, Google Drive APIs, Cordova, and Android app development. Google's Javascript client API (GAPI) could not be used because of the [Content Security Policy](https://developer.chrome.com/apps/contentSecurityPolicy) (CSP) restrictions in packaged apps so I used XHR/CORS calls to the Google REST APIs.

Android [SDK](https://developer.android.com/sdk/index.html#Other) and [CCA](https://github.com/MobileChromeApps/mobile-chrome-apps) are required to build the apk version of this application.

## Installation

```
$ npm install
```

## Build
```
$ grunt
```

### Chrome Packaged App:
```
$ grunt build_crx
```

### Android App:

```
$ grunt build_apk
```

## Usage

### File Format:
TxtNotes reads text files where each line ends with a new line character `\n` or `\r\n`. Each note should be separated by an extra line feed.

### Example:

	First line (header)\n
	Second line\n
	Third line\n
	\n

## Features

- log into google drive account
- cache auth for future non-interactive login
- revoke cached auth
- create new files and upload to drive
- list 'text/plain' files on drive and select for download
- cache downloaded files in local storage for offline access
- save changes to drive and local storage
- import files and upload to drive
- export files to download folder
- delete (to trash) files on drive
- add, edit, and remove notes in text file

## [License](LICENSE)