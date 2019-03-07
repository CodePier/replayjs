import ListenInterface from "../interfaces/ListenInterface";
import { NullPresenceChannel } from "laravel-echo/dist/channel";
import ConsoleDataInterface from "../interfaces/ConsoleDataInterface";

export default class CaptureConsoleMessages implements ListenInterface {
  protected readonly timing: number;
  protected channel: NullPresenceChannel;
  protected readonly event = "console-message";

  protected originalConsoleLog;
  protected originalConsoleInfo;
  protected originalConsoleWarn;
  protected originalConsoleError;

  constructor(timing: number) {
    this.timing = timing;
  }

  public setup(channel: NullPresenceChannel) {
    this.channel = channel;
    let originalConsoleLog = (this.originalConsoleLog = window.console.log);
    let originalConsoleInfo = (this.originalConsoleInfo = window.console.info);
    let originalConsoleWarn = (this.originalConsoleWarn = window.console.warn);
    let originalConsoleError = (this.originalConsoleError =
      window.console.error);

    window.console.log = this.captureLog(originalConsoleLog, "log");
    window.console.info = this.captureLog(originalConsoleInfo, "info");
    window.console.warn = this.captureLog(originalConsoleWarn, "warn");
    window.console.error = this.captureLog(originalConsoleError, "error");
  }

  public teardown() {
    window.console.log = this.originalConsoleLog;
    window.console.info = this.originalConsoleInfo;
    window.console.warn = this.originalConsoleWarn;
    window.console.error = this.originalConsoleError;
  }

  private captureLog(originalFunction, type) {
    let timing = this.timing;
    let whisper = this.whisper.bind(this);

    return function(...messages) {
      whisper({
        type,
        messages,
        timing: new Date().getTime() - timing,
      });
      return originalFunction.apply(this, arguments);
    };
  }

  public whisper(data: ConsoleDataInterface) {
    this.channel.whisper(this.event, data);
  }
}