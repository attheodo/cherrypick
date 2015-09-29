## Cherrypick - Painless .ipa downloading from iTunes
Cherrypic is a nifty little tool that allows you to automagically download an iOS application from the App Store. It utilizes JXA (Javascript for Automation) framework on OSX to fire up iTunes, open the app's App Store page and download it, all without a single click from your end.

### Usage
```
$ ./cherrypick.js
Cherrypick - Painless .ipa download from iTunes

Usage:
$ cherrypick.js <App URL on iTunes>
NOTE: If your url contains the ? character, make sure you enclose your URL in "".
```
**NOTES:**
- Still highly experimental. Might break with new iTunes versions.
- Everything is synchronous... cause JXA.
- The shebang script will exit gracefully `(0)` if everything went fine or throw `(-1)` if shit happened. Usefull if you want to use it along with other tools/script of your own.
- iTunes might ask you for your Apple ID password at some point. There's a "remember me" option checkbox which you might want to click so it doesn't block the script every time.
