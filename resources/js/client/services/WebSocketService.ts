declare global {
  interface Window {
    Pusher: PusherConnector;
  }
}

import Echo from "laravel-echo";
import { PusherConnector } from "laravel-echo/dist/connector";

window.Pusher = require("pusher-js");

export default class WebSocketService {
  public channel: Echo;
  protected apiKey: string;

  public auth(apiKey) {
    this.apiKey = apiKey;
  }

  public async connect() {
    if (!this.channel) {
      console.info("try to connect", {
        key: `${this.apiKey}/${__ENV_VARIABLES__.services.PUSHER_APP_KEY}`,
      });
      this.channel = new Echo({
        broadcaster: "pusher",
        enabledTransports: ["ws", "wss"],
        wsHost: __ENV_VARIABLES__.app.WS_HOST,
        wsPort: __ENV_VARIABLES__.app.WS_PORT,
        key: `${this.apiKey}/${__ENV_VARIABLES__.services.PUSHER_APP_KEY}`,
        authEndpoint: `${__ENV_VARIABLES__.app.APP_URL}/api/broadcasting/auth`,
        disableStats: true,
        auth: {
          headers: {
            Authorization: "Bearer " + this.apiKey,
          },
        },
      });

      this.channel.connector.pusher.bind("auth", (data) => {
        console.info(data);
      });
    }
    return this.channel;
  }

  public disconnect() {
    this.channel.disconnect();
    this.channel = null;
  }
}
