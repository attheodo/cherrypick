#!/usr/bin/env osascript -l JavaScript

ObjC.import('stdlib')

var iTunesApp;
var iTunesAppWindow;
var appName;

/*
 * OSA entry function ¯\_(ツ)_/¯
 *
 * @param {Object} args The CLI arguments
 */
function run(args) {

    if (args.length < 1) {

        printHelp();

    } else {

        openiTunesWithURL(fixUrl(args[0]));
        getiTunesAppWindow();
        downloadApplication();
        monitorDownload();
        quit();

    }
}

/*
 * Prints nifty lil' help message
 */
var printHelp = function() {

    console.log('Cherrypick - Painless .ipa download from iTunes');
    console.log('\n\tUsage:');
    console.log('\t$ cherrypick.js <App URL on iTunes>');
    console.log('\t  NOTE: If your url contains the ? character, make sure you enclose your URL in "".');

};

/*
 * Convert url from https to itms
 *
 * @param {String} iTunesURL
 */
var fixUrl = function(url) {

    return url.replace('https:', 'itms:');

};

/*
 * Fires up iTunes application and directs it to open our app URL in App Store
 *
 * @param {String} iTunesURL The iTunes URL to open in iTunes. MUST start with "itms://"
 */
var openiTunesWithURL = function(iTunesURL) {

    console.log("[+] Firing up iTunes with location: " + iTunesURL);
    iTunesApp = Application('iTunes');
    iTunesApp.activate();
    iTunesApp.openLocation(iTunesURL);

};

/*
 * Gets the iTunes application window through the `System Events` framework.
 * We need this to mess with low level UI controls because most of them are not
 * directly accessible from what Automation/JXA exposes for iTunes app.
 */
var getiTunesAppWindow = function() {

    var system = Application('System Events');
    iTunesAppWindow = system.applicationProcesses.byName('iTunes').windows.byName('iTunes');

};

/*
 * Juicy part. This method keeps trying to find the "Download" button on the app's
 * page on iTunes. Every time it bumps the polling interval by one second cause we
 * don't want to be very aggressive.
 */
var downloadApplication = function() {

    var retries = 0;
    var maxRetries = 5;

    while(true) {

        try {

            /*
                This path is hardcoded for now. Basically we dump `iTunesAppWindow.entireContents()` somewhere,
                find/replace "," with <new lines> and we try to pin point which control we're interested in by eye.
            */
            var buttonDescrStrComponents = iTunesAppWindow.splitterGroups.at(0).scrollAreas.at(0).uiElements.at(0).groups.at(2).buttons.at(0).description().split(",");

            appName = buttonDescrStrComponents[2].slice(1);
            console.log('[+] Found application: ' + appName+'. Downloading...');

            iTunesAppWindow.splitterGroups.at(0).scrollAreas.at(0).uiElements.at(0).groups.at(2).buttons.at(0).click();

            break;

        } catch(e) {

            /*
                iTunes needs to load the App Store in its embeded littled browser thingie which might take a while.
                Unfortunately, fucking JXA methods won't return a proper error but rather throw a runtime exception.
                Essentially, we keep retrying by incrementing our delay until we reach the desireable state where the
                "download" control can be paresed and the download can be initiated.
            */
            var delayThreshold = retries + 1;

            console.log('[!] State not ready yet, retrying in (' + delayThreshold +'s)...');
            delay(delayThreshold);

            if(++retries === maxRetries) {
                console.log('[!] Cannot reach desirable state. Bailing out...');
                $.exit(-1);
            }
        }

    }


};

/*
 * Steps into ObjC lalaland and checks whether our app was downloaded. The app
 * download starts as a *.tmp file in "_/iTunes Media/Downloads". When the download
 * is finished, it's copied over to "_/iTunes Media/Mobile Applications". We Poll
 * that directory and when our file appears, we're done.
 *
 */
var monitorDownload = function() {

    var isFileNotFound = true;

    /* TODO: Grab the current username automatically
        For now just change `thanosth` with `$ whoami`
    */
    var downloadsPath = '/Users/thanosth/Music/iTunes/iTunes Media/Mobile Applications';

    /* Stepping in Objective-C territory. There might be a saner way to do this by manipulating
        Finder via `System Events` the way we do with iTunes, but will probably be very very slow.

        For now, we just use the bridge to NSFileManager methods.
    */
    var fileMgr = $.NSFileManager.defaultManager;

    while(isFileNotFound) {

        var files = [];

        var lstFiles = ObjC.unwrap(
            // Need to bring this from ObjC runtime to Javascript runtime.
            // Parallel universes! Fringe science!
            fileMgr.contentsOfDirectoryAtPathError(downloadsPath, null)
        );

        if (lstFiles) {

            for(var i=0; i < lstFiles.length; i++) {

                var filename = ObjC.unwrap(lstFiles[i]);

                if (filename.indexOf(appName) > -1) {

                    isFileNotFound = false;
                    console.log('\n\t ✔ Download complete. ' + downloadsPath + '/' + filename);

                }

            }
        }

        // Poll every one second
        delay(1);
    }

};

/*
 * Pretty self explanatory
 */
var quit = function() {
    iTunesApp.quit();
    $.exit(0);
};
