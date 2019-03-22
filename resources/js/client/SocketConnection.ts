declare global {
  interface Window {
    Pusher: PusherConnector;
  }
}

import Echo from "laravel-echo";
import { PusherConnector } from "laravel-echo/dist/connector";

window.Pusher = require("pusher-js");

export default class SocketConnection {
  protected apiKey: string;

  public client: Echo;

  public setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  public connect() {
    if (!this.apiKey) {
      throw Error("You need to set your API Key.");
    }

    if (!this.client) {
      this.client = new Echo({
        broadcaster: "pusher",
        enabledTransports: ["ws", "wss"],
        wsHost: __ENV_VARIABLES__.app.WS_HOST,
        wsPort: __ENV_VARIABLES__.app.WS_PORT,
        key: __ENV_VARIABLES__.services.PUSHER_APP_KEY,
        authEndpoint: `${__ENV_VARIABLES__.app.APP_URL}/api/broadcasting/auth`,
        disableStats: true,
        auth: {
          headers: {
            Authorization: "Bearer " + this.apiKey,
          },
        },
      });
    }
    return this.client;
  }

  public disconnect() {
    this.client.disconnect();
    this.client = null;
  }
}
