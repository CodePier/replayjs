import DomSource from "./../mirror/DomSource";
import ListenInterface from "../interfaces/ListenInterface";
import { NullPresenceChannel } from "laravel-echo/dist/channel";
import ConsoleDataInterface from "../interfaces/ConsoleDataInterface";

export default class CaptureShadowDomChanges implements ListenInterface {
  protected domSource: DomSource;
  protected originalAttachShadow;
  protected originalCreateShadowRoot;
  protected readonly event = "changes";
  protected channel: NullPresenceChannel;

  public setup(channel: NullPresenceChannel) {
    this.channel = channel;
    this.originalAttachShadow = HTMLElement.prototype.attachShadow;
    //// this.originalCreateShadowRoot = HTMLElement.prototype.createShadowRoot;

    if (typeof this.originalAttachShadow === "function") {
      HTMLElement.prototype.attachShadow = this.captureShadowEvents(
        this.originalAttachShadow,
      );
    }
    // if(typeof this.originalCreateShadowRoot === 'function') {
    //
    // }
  }

  public teardown() {
    HTMLElement.prototype.attachShadow = this.originalAttachShadow;
    // HTMLElement.prototype.createShadowRoot = this.originalCreateShadowRoot;
  }

  private captureShadowEvents(originalFunction) {
    let channel = this.channel;

    return function(options) {
      let sh = originalFunction.call(this, options);

      let rootNode = this.getRootNode({
        composed: true,
      });

      let observer = new MutationObserver((mutations) => {
        console.info(mutations);
      });

      observer.observe(sh, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        characterDataOldValue: true,
      });

      return sh;
    };
  }

  private whisper(data: ConsoleDataInterface) {
    this.channel.whisper(this.event, data);
  }
}
