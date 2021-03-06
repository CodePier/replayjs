<template>
  <div>
    <div id="player-wrapper">
      <div class="dev-tool">
        dev tool
      </div>

      <div class="playback">
        <pre>IS LOADING : {{ isLoading }}</pre>
        <div
          class="preview-box"
          ref="previewBox"
          :class="{ loading: isLoading }"
        >
          <div class="overlay" ref="overlay">
            <div ref="clicks" id="clicks"></div>
            <div ref="cursor" id="cursor"></div>
          </div>
          <iframe
            ref="preview"
            id="preview"
            sandbox="allow-scripts allow-same-origin"
          ></iframe>
        </div>
      </div>

      <div class="information">
        information

        <h1>Scale</h1>
        <pre>{{ scale }}</pre>
        <h1>User is Live</h1>
        <pre>{{ canViewLive }}</pre>
        <button @click="goLive" :disabled="!canViewLive">
          Connect To Stream
        </button>

        <pre>Current : {{ currentTime }}</pre>

        <h1>Skip Inactivity</h1>
        <pre>{{ skipInactivity }}</pre>
        <button @click="skipInactivity = !skipInactivity">
          Toggle Skip Activity
        </button>

        <h1>Speed</h1>
        <pre>{{ playbackSpeed }}x</pre>

        <button @click="changePlaybackSpeed(1)">x1</button>
        <button @click="changePlaybackSpeed(1.25)">x1.25</button>
        <button @click="changePlaybackSpeed(1.5)">x1.5</button>
        <button @click="changePlaybackSpeed(2)">x2</button>

        <h1>Current Activity Range</h1>
        >>
        <pre>{{ currentActivityRange }}</pre>
        <<
      </div>

      <div class="controls">
        controls
        <session-progress-bar
          v-if="session"
          @play="play"
          @stop="stop"
          @seek="seek"
          :is-playing="isPlaying"
          :current-time="currentTime"
          :starting-time="startingTime"
          :ending-time="endingTime"
          :session="session"
          :activity-ranges="activityRanges"
        ></session-progress-bar>
      </div>
    </div>
  </div>
</template>

<script>
import MirrorMixin from "./mixins/MirrorMixin";
import PlayerMixin from "./mixins/PlayerMixin";
import StreamMixin from "./mixins/StreamMixin";
import MirrorEventsMixin from "./mixins/MirrorEventsMixin";
import SessionProgressBar from "./components/SessionProgressBar";
import SessionPlayerEventsWorker from "./workers/session-player-events.worker";
import SessionPlayerActivityTimingsWorker from "./workers/session-player-activity-timings.worker";

const sessionPlayerEventsWorker = new SessionPlayerEventsWorker();
const sessionPlayerActivityTimingsWorker = new SessionPlayerActivityTimingsWorker();

export default {
  provide() {
    return {
      sessionPlayerEventsWorker: this.sessionPlayerEventsWorker,
    };
  },
  mixins: [MirrorMixin, PlayerMixin, StreamMixin, MirrorEventsMixin],
  components: {
    SessionProgressBar,
  },
  props: {
    session: {
      required: true,
    },
  },
  data() {
    return {
      initialized: false,
    };
  },
  created() {
    this.sessionPlayerActivityTimingsWorker.onmessage = ({ data }) => {
      this.activityRanges = data;
    };
  },
  mounted() {
    this.previewFrame = document.getElementById("preview");
    this.previewDocument = this.previewFrame.contentWindow.document;
  },
  watch: {
    session: {
      immediate: true,
      handler(session) {
        if (session && this.initialized === false) {
          this.initialized = true;
          this.initializePlayer();
          this.sessionPlayerEventsWorker.postMessage({
            event: "addEvents",
            data: {
              session,
              startingTime: this.startingTime,
            },
          });

          this.sessionPlayerActivityTimingsWorker.postMessage({
            event: "addAllActivity",
            data: {
              session,
              startingTime: this.startingTime,
              skipThreshold: this.skipThreshold,
            },
          });
        }
      },
    },
  },
  computed: {
    sessionPlayerEventsWorker() {
      return sessionPlayerEventsWorker;
    },
    sessionPlayerActivityTimingsWorker() {
      return sessionPlayerActivityTimingsWorker;
    },
  },
};
</script>

<style lang="scss">
body {
  margin: 0;
}

.overlay {
  z-index: 1;
  position: absolute;
}

.overlay,
#preview {
  transform-origin: 0 0;
}

.left-nav {
  display: flex;
  flex: 0 0 150px;
}

.preview-box {
  overflow: hidden;
  max-height: 100%;
  flex: 1 1 auto;
  &.loading {
    &:after {
      position: absolute;
      content: "";
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0.5;
      background-color: red;
    }
  }
}

.sessions {
  height: 100px;
  overflow: hidden;
}

@-webkit-keyframes load-progress {
  100% {
    opacity: 0;
    margin-top: -40px;
    margin-left: -40px;
    border-width: 40px;
  }
}

@keyframes load-progress {
  100% {
    opacity: 0;
    margin-top: -40px;
    margin-left: -40px;
    border-width: 40px;
  }
}

#clicks div {
  width: 0;
  height: 0;
  opacity: 0.6;
  position: fixed;
  border-radius: 50%;
  border: 1px solid #6c7a89;
  background-color: #6c7a89;
  animation: load-progress 1s;
}

#cursor {
  top: 1px;
  z-index: 999999999999999999; // rofl
  width: 25px;
  height: 25px;
  position: absolute;
  background-size: contain;
  background-repeat: no-repeat;
  background-image: url("../../../../../images/cursor.png");
}
</style>
