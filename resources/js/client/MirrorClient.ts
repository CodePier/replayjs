import DomSource from "./mirror/DomSource";
import InputEvents from "./events/InputEvents";
import ListenInterface from "./interfaces/ListenInterface";
import { NullPresenceChannel } from "laravel-echo/dist/channel";
import InitializeDataInterface from "./interfaces/InitializeDataInterface";
import DomChangesDataInterface from "./interfaces/DomChangesDataInterface";

export default class MirrorClient implements ListenInterface {
  protected baseHref: string;
  protected domSource: DomSource;
  protected inputEvents: InputEvents;
  protected channel: NullPresenceChannel;

  constructor(baseHref: string) {
    this.baseHref = baseHref;
    this.inputEvents = new InputEvents();
  }

  public setup(channel: NullPresenceChannel) {
    this.channel = channel;
    this.initialize();
    window.addEventListener("focus", this.tabFocusActivity.bind(this));
    window.addEventListener("blur", this.tabFocusActivity.bind(this));
  }

  public teardown() {
    this.disconnect();
    window.removeEventListener("focus", this.tabFocusActivity.bind(this));
    window.removeEventListener("blur", this.tabFocusActivity.bind(this));
  }

  private disconnect() {
    if (this.domSource) {
      this.domSource.disconnect();
      this.domSource = null;
    }
  }

  private whisperInitialized(data: InitializeDataInterface) {
    this.channel.whisper("initialize", data);
  }

  private whisperChanges(data: DomChangesDataInterface) {
    this.channel.whisper("changes", data);
  }

  private tabFocusActivity() {
    let tabHasFocus = document.hasFocus();
    if (tabHasFocus) {
      this.initialize();
    } else {
      this.disconnect();
    }
    this.channel.whisper("focus-activity", {
      timing: Date.now(),
      tabHasFocus: tabHasFocus,
    });
  }

  private initialize() {
    this.disconnect();
    this.domSource = new DomSource(document, {
      initialize: (rootId, children) => {
        this.whisperInitialized({
          rootId,
          children,
          timing: Date.now(),
          baseHref: this.baseHref,
        });
        this.inputEvents.setup();
      },
      applyChanged: (removed, addedOrMoved, attributes, text) => {
        console.group("CHANGES");
        console.info("Removed", removed);
        console.info("addedOrMoved", addedOrMoved);
        console.info("attributes", attributes);
        console.info("text", text);
        console.groupEnd();
        this.whisperChanges({
          text,
          removed,
          attributes,
          addedOrMoved,
          timing: Date.now(),
        });
        if (addedOrMoved.length) {
          this.inputEvents.setup();
        }
      },
    });
  }
}