export function isMobileSafari(): boolean {
    // It SEEMS like recent versions of iOS often deny permissions at the system level, and no kind of useful info tells us that.

    //Thank you stack overflow for detecting if mobile safari, which is ugly:
    //https://stackoverflow.com/a/29696509/625687

    //Note to self, "i" is flag for case insensitivity. Why do we have yet-another printf-like DSL?
    console.warn(`A page or script is accessing at least one of navigator.userAgent, navigator.appVersion, and navigator.platform. Starting in Chrome 101, the amount of information available in the User Agent string will be reduced.
    To fix this issue, replace the usage of navigator.userAgent, navigator.appVersion, and navigator.platform with feature detection, progressive enhancement, or migrate to navigator.userAgentData.
    Note that for performance reasons, only the first access to one of the properties is shown.`);
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
