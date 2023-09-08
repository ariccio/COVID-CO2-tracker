export function isMobileSafari(): boolean {
    // It SEEMS like recent versions of iOS often deny permissions at the system level, and no kind of useful info tells us that.

    //Thank you stack overflow for detecting if mobile safari, which is ugly:
    //https://stackoverflow.com/a/29696509/625687

    //Note to self, "i" is flag for case insensitivity. Why do we have yet-another printf-like DSL?
    console.warn(`A page or script is accessing at least one of navigator.userAgent, navigator.appVersion, and navigator.platform. Starting in Chrome 101, the amount of information available in the User Agent string will be reduced.
    To fix this issue, replace the usage of navigator.userAgent, navigator.appVersion, and navigator.platform with feature detection, progressive enhancement, or migrate to navigator.userAgentData.
    Note that for performance reasons, only the first access to one of the properties is shown.`);
    console.log("Notes to self, see the following:");
    console.log("https://blog.chromium.org/2021/09/user-agent-reduction-origin-trial-and-dates.html");
    console.log("https://web.dev/migrate-to-ua-ch/");
    console.log("https://www.chromium.org/updates/ua-reduction/");

    const ua = window.navigator.userAgent;
    const iPad = ua.match(/iPad/i);
    const iPhone = ua.match(/iPhone/i);
    const iOS = ((iPad !== null) || (iPhone !== null));
    const webKit = ua.match(/Webkit/i);
    const chromeOnIOS = ua.match(/CriOS/i);
    if (iOS && (webKit !== null) && (chromeOnIOS === null)) { 
        return true;
    }
    return false;
}

export function isMobileFacebookBrowser(): boolean {
    // Hmm, let's try and detect a facebook in-app browser instance...
    // example user agent from sentry:
    //Mozilla/5.0 (iPhone; CPU iPhone OS 15_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/19B81 [FBAN/FBIOS;FBDV/iPhone13,2;FBMD/iPhone;FBSN/iOS;FBSV/15.1.1;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5]


    // Some curious checks suggested here: https://blog.tomayac.com/2019/12/09/inspecting-facebooks-webview/
    const temp = (window as any).TEMPORARY;
    const persistent = (window as any).PERSISTENT;
    if (temp !== undefined) {
        console.log(`window.TEMPORARY: ${temp}`);
    }
    if (persistent !== undefined) {
        console.log(`window.PERSISTENT: ${persistent}`);
    }

    console.warn(`A page or script is accessing at least one of navigator.userAgent, navigator.appVersion, and navigator.platform. Starting in Chrome 101, the amount of information available in the User Agent string will be reduced.
    To fix this issue, replace the usage of navigator.userAgent, navigator.appVersion, and navigator.platform with feature detection, progressive enhancement, or migrate to navigator.userAgentData.
    Note that for performance reasons, only the first access to one of the properties is shown.`);
    console.log("Notes to self, see the following:");
    console.log("https://blog.chromium.org/2021/09/user-agent-reduction-origin-trial-and-dates.html");
    console.log("https://web.dev/migrate-to-ua-ch/");
    console.log("https://www.chromium.org/updates/ua-reduction/");

    const ua = window.navigator.userAgent;
    const FBAN = ua.match(/FBAN/);
    const FBIOS = ua.match(/FBIOS/);
    const FBLC = ua.match(/FBLC/);
    const isAndroidOrIOS = ((FBAN !== null) || (FBIOS !== null));
    const hasFBLocale = (FBLC !== null);
    if (isAndroidOrIOS && hasFBLocale) {
        return true;
    }
    return false;
}


export function isMacosChrome(): boolean {
    // For some reason, google one tap often does not display on macos chrome, with no known reason?!
    // https://covid-co2-tracker.sentry.io/share/issue/8a22358856724a1dabe69b0bc9213cb6/
    const ua = window.navigator.userAgent;
    const chrome = ua.match(/Chrome/i);
    const mac = ua.match(/Macintosh/i);
    if (chrome === null) {
        return false;
    }
    if (mac === null) {
        return false;
    }
    return true;   
}

export function isTwitterAppBrowser(): boolean {
    // Apparently can't display one-tap sign in for twitter.
    // https://covid-co2-tracker.sentry.io/share/issue/ab438756ce49405d871617f2947d5927/
    const isTwitterBrowser = window.navigator.userAgent.match(/Twitter for iPhone/i);
    if (isTwitterBrowser) {
        return true;
    }
    return false;
}

export function isInstagramAppBrowser(): boolean {
    // may not be able to display for instagram app browser?

    const isInstagramBrowser = window.navigator.userAgent.match(/Instagram/i);
    if (isInstagramBrowser !== null) {
        return true;
    }
    return false;
}

export function isAhrefsbot(): boolean {
    const isFuckingAhrefsBot = window.navigator.userAgent.match(/AhrefsBot/i);
    if (isFuckingAhrefsBot !== null) {
        return true;
    }
    return false;
}