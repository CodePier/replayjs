import Echo from "laravel-echo";
// @ts-ignore
window.Pusher = require("pusher-js");
import { TreeMirrorClient } from "./tree-mirror";

const baseHref = window.location.origin;

export default class Client {
  protected echo = null;
  protected timing = null;
  protected channel = null;
  protected movements = [];
  protected streamClient;

  constructor() {
    this.startClient();
  }

  public startClient() {
    this.timing = new Date().getTime();
    this.echo = new Echo({
      broadcaster: "pusher",
      wsHost: __ENV_VARIABLES__.app.WS_HOST,
      wsPort: __ENV_VARIABLES__.app.WS_PORT,
      key: __ENV_VARIABLES__.services.PUSHER_APP_KEY,
      authEndpoint: `${__ENV_VARIABLES__.app.APP_URL}/api/broadcasting/auth`,
      disableStats: true,
    });

    this.channel = this.echo
      .join(`chat`)
      .here(() => {
        this.setupMirror();
      })
      .joining(() => {
        this.setupMirror();
      });

    this.attachClickEvents();
    this.attachScrollingEvents();
    this.attachWindowResizeEvent();
    this.attachMouseMovementEvents();
    this.attachAttributeHandlersToInputs();
  }

  protected setupMirror() {
    if (this.streamClient) {
      this.streamClient.disconnect();
    }
    this.streamClient = new TreeMirrorClient(
      document,
      {
        initialize: (rootId, children) => {
          this.channel.whisper("initialize", {
            rootId,
            children,
            baseHref,
            timing: new Date().getTime() - this.timing,
          });
          this.resize();
        },
        applyChanged: (removed, addedOrMoved, attributes, text) => {
          this.channel.whisper("changes", {
            text,
            removed,
            baseHref,
            attributes,
            addedOrMoved,
            timing: new Date().getTime() - this.timing,
          });
          if (addedOrMoved.length) {
            this.attachAttributeHandlersToInputs();
          }
        },
      },
      [{ all: true }],
    );
  }

  protected attachClickEvents() {
    document.onclick = (event: MouseEvent) => {
      this.channel.whisper("click", {
        x: event.clientX,
        y: event.clientY,
        timing: new Date().getTime() - this.timing,
      });
    };
  }

  protected attachScrollingEvents() {
    document.onscroll = () => {
      this.channel.whisper("scroll", {
        timing: new Date().getTime() - this.timing,
        scrollPosition: document.documentElement.scrollTop,
      });
    };
  }

  protected attachWindowResizeEvent() {
    window.onresize = () => {
      this.resize();
    };
  }

  private resize() {
    this.channel.whisper("window-size", {
      width: window.innerWidth,
      height: window.innerHeight,
      timing: new Date().getTime() - this.timing,
    });
  }

  protected attachMouseMovementEvents() {
    document.onmousemove = (event: MouseEvent) => {
      this.movements.push({
        x: event.pageX,
        y: event.pageY,
        timing: new Date().getTime() - this.timing,
      });
    };
    // TODO - sometimes this doesn't get attached properly?
    setInterval(() => {
      console.info("OK WHISPER IT");
      if (this.movements.length) {
        this.channel.whisper("mouse-movement", this.movements);
        this.movements = [];
      }
    }, 1000);
  }

  protected attachAttributeHandlersToInputs() {
    document.querySelectorAll("input, textarea").forEach((element) => {
      // @ts-ignore
      element.oninput = (event) => {
        let type = event.target.type;
        if (type) {
          switch (type) {
            case "text":
            case "textarea":
              event.target.setAttribute("value", event.target.value);
              break;
          }
        }
      };
    });

    document.querySelectorAll("select").forEach((element) => {
      element.onchange = (event) => {
        // @ts-ignore
        event.target.setAttribute(
          "selected-option",
          // @ts-ignore
          event.target.selectedIndex,
        );
      };
    });

    document
      .querySelectorAll('input[type="checkbox"], input[type="radio"]')
      .forEach((element) => {
        // @ts-ignore
        element.onchange = (event) => {
          document
            .querySelectorAll(
              `input[type="radio"][name="${event.target.name}"]`,
            )
            .forEach((element) => {
              element.removeAttribute("checked");
            });
          event.target.setAttribute("checked", event.target.checked);
        };
      });
  }
}
new Client();
