import { record, pack } from 'rrweb';
import { v4 as uuidv4 } from 'uuid';
import { gzip } from 'pako';

interface OptionType {
  apiUrl?: string;
  projectName: string;
  deviceId?: string;
  userEmail?: string;
  metaData?: any;
}
interface BrowserMetaInfo {
  browser_type: string;
  device_os?: string;
  device_type?: string;
  browser_version: string;
  screen_resolution: string;
}

interface BaseAttributesDTO extends BrowserMetaInfo {
  session_id: string;
  client_timestamp: number;
  device_id?: string;
  project_name: string;
  origin: string;
  metadata: any;
}

interface EventsDTO {
  base_attributes: BaseAttributesDTO;
  session_attribute: {
    event_id: string;
    start_timestamp: number;
    end_timestamp: number;
    data: any;
  };
}

const getBrowserInfo = (): BrowserMetaInfo => {
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

class SnapshotRecorder {
  private events: any[];
  private sessionId: string;
  private options: any;
  private stopFn: any;
  private globalTimer: any;
  constructor(options: OptionType) {
    this.events = [];
    this.sessionId = '';
    this.options = options;
  }

  private sendEvents = (startTime: number) => {
    if (this.events.length === 0) return;

    const currentTime = Date.now();
    const browserInfo = getBrowserInfo();
    const request: EventsDTO = {
      base_attributes: {
        ...browserInfo,
        session_id: this.sessionId,
        client_timestamp: currentTime,
        project_name: this.options?.projectName,
        device_id: this.options?.deviceId,
        origin: window?.location?.origin,
        metadata: {
          ...this.options?.metaData,
        },
      },
      session_attribute: {
        event_id: uuidv4(),
        start_timestamp: startTime,
        end_timestamp: currentTime,
        data: this.events,
      },
    };

    fetch(this.options?.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Encoding': 'gzip',
        'Content-Type': 'application/json',
      },
      body: gzip(JSON.stringify(request)),
    })
      .then(() => {
        this.events = [];
      })
      .catch((error) => {
        console.error('Failed to send events to the server', error);
      });
  };

  private handleVisibilityChange = () => {
    document.visibilityState === 'hidden'
      ? this.stopRecording()
      : this.startRecording();
  };

  private startRecording = () => {
    this.sessionId = uuidv4();
    this.globalTimer = setInterval(() => {
      this.sendEvents(Date.now());
    }, 4000);
    this.stopFn = record({
      emit: (event: any) => {
        this.events.push(event);
      },
      sampling: {
        mousemove: false,
        scroll: 150,
        media: 800,
        input: 'last',
      },
      packFn: pack,
      recordCanvas: true
    });
  };

  public stopRecording = () => {
    this.sendEvents(Date.now());
    this.stopFn();
    clearInterval(this.globalTimer);
    this.events = [];
  };

  public startSnapshotRecording = () => {
    this.startRecording();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    return () => {
      clearInterval(this.globalTimer);
      document.removeEventListener(
        'visibilitychange',
        this.handleVisibilityChange
      );
    };
  };
}

export default SnapshotRecorder;
