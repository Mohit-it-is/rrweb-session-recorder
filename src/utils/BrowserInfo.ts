import {BrowserMetaInfo} from "../interfaces/BrowserMetaInfo";

export const getBrowserInfo = (): BrowserMetaInfo => {
    const userAgent = window?.navigator?.userAgent;

    let browserType = '';
    let browserVersion = '';
    let device = '';
    let deviceOS = '';
    const browserMatch = userAgent.match(
        /(chrome|firefox|safari|edge|opera(?=\/))\/?\s*(\d+)/i
    );
    if (browserMatch && browserMatch.length >= 3) {
        browserType = browserMatch[1].toLowerCase();
        browserVersion = browserMatch[2];
    }

    if (/Mobi/i.test(userAgent)) {
        device = 'Mobile';
    } else if (/Tablet/i.test(userAgent)) {
        device = 'Tablet';
    } else {
        device = 'Desktop';
    }

    const osMatch = userAgent.match(
        /(windows nt|mac os x|android|ios) ([\d._]+)/i
    );
    if (osMatch && osMatch.length >= 3) {
        deviceOS = osMatch[1].replace(/_/g, ' ');
    }

    const screenWidth = window?.screen?.width;
    const screenHeight = window?.screen?.height;
    const screenResolution = `${screenWidth}x${screenHeight}`;

    return {
        browser_type: browserType,
        device_os: deviceOS,
        device_type: device,
        browser_version: browserVersion,
        screen_resolution: screenResolution,
    };
};