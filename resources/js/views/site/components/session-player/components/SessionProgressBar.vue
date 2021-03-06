<template>
  <div>
    <div class="playAndPause">
      <input
        type="checkbox"
        id="playAndPause"
        name="playAndPause"
        :checked="!isPlaying"
        @click="playAndPause"
      />
      <label for="playAndPause"></label>
    </div>
    <pre>EVENTS : {{ numberOfEvents }}</pre>
    <pre>Current Time : {{ currentTimeDisplay }}</pre>
    <pre>End Time : {{ endingTimeDisplay }}</pre>
    <div class="progress" @click="playAtPosition">
      <div
        class="progress--bar"
        :style="{
          width: currentTimePercentage,
        }"
      ></div>
      <session-progress-bar-canvas
        :starting-time="startingTime"
        :ending-time="endingTime"
      >
        <session-progress-bar-activity
          style="z-index:1"
          :starting-time="startingTime"
          :ending-time="endingTime"
          :activity-ranges="activityRanges"
        ></session-progress-bar-activity>
      </session-progress-bar-canvas>

      <session-progress-bar-canvas
        :key="zIndex"
        v-for="(playerEventTickType, zIndex) in playerEventTickTypes"
        :style="{ zIndex: parseInt(zIndex + 2) }"
        :starting-time="startingTime"
        :ending-time="endingTime"
      >
        <session-progress-bar-tick
          :ending-time="endingTime"
          :starting-time="startingTime"
          :events="events[playerEventTickType]"
          :color="playerEventColors[playerEventTickType]"
        ></session-progress-bar-tick>
      </session-progress-bar-canvas>
    </div>
  </div>
</template>

<script>
import playerEventColors from "@app/constants/playerEventColors";
import { playerEventTypes } from "@app/constants/playerEventTypes";
import SessionProgressBarTick from "./progress-bar-components/SessionProgressBarTick";
import SessionProgressBarCanvas from "./progress-bar-components/SessionProgressBarCanvas";
import SessionProgressBarActivity from "./progress-bar-components/SessionProgressBarActivity";
import playerEventTickTypes from "@app/constants/playerEventTickTypes";

export default {
  inject: ["sessionPlayerEventsWorker"],
  components: {
    SessionProgressBarTick,
    SessionProgressBarCanvas,
    SessionProgressBarActivity,
  },
  props: {
    currentTime: {
      required: true,
    },
    isPlaying: {
      required: true,
      type: Boolean,
    },
    startingTime: {
      required: true,
    },
    endingTime: {
      required: true,
    },
    session: {
      required: true,
    },
    activityRanges: {
      required: true,
    },
  },
  data() {
    return {
      events: [],
      playerEventTypes,
      playerEventColors,
      playerEventTickTypes,
    };
  },
  mounted() {
    this.sessionPlayerEventsWorker.onmessage = ({ data }) => {
      this.events = data;
    };
  },
  methods: {
    playAndPause() {
      if (this.isPlaying) {
        return this.$emit("stop");
      }
      this.$emit("play");
    },
    playAtPosition(event) {
      let rect = event.target.getBoundingClientRect();
      let percentageFromLeftSide = (event.clientX - rect.left) / rect.width;
      this.$emit(
        "seek",
        this.startingTime + percentageFromLeftSide * this.endingTimeNormalized,
      );
    },
    _convertMsToTime(ms) {
      let seconds = ms / 1000;

      let hours = parseInt(seconds / 3600);
      seconds = seconds % 3600;

      let minutes = parseInt(seconds / 60);
      seconds = seconds % 60;

      let timeString = `${minutes.toString().lpad("0", 2)}:${parseInt(seconds)
        .toString()
        .lpad("0", 2)}`;
      if (hours > 0) {
        timeString = `${hours}:${timeString}`;
      }
      return timeString;
    },
  },
  computed: {
    endingTimeNormalized() {
      return this.endingTime - this.startingTime;
    },
    currentTimeNormalized() {
      return this.currentTime - this.startingTime;
    },
    endingTimeDisplay() {
      return this._convertMsToTime(this.endingTimeNormalized);
    },
    currentTimeDisplay() {
      return this._convertMsToTime(this.currentTimeNormalized);
    },
    currentTimePercentage() {
      return `${(this.currentTimeNormalized / this.endingTimeNormalized) *
        100}%`;
    },
    numberOfEvents() {
      let total = 0;
      for (let eventType in this.events) {
        total = total + this.events[eventType].length;
      }
      return total;
    },
  },
};
</script>

<style lang="scss">
.progress {
  border: 1px solid #ccc;
  background-color: #fff;
  height: 20px;
  border-radius: 8px;
  display: flex;
  position: relative;

  &--bar {
    pointer-events: none;
    background-color: #48acf0;
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
  }

  &--moment {
    pointer-events: none;
    border-right: 1px solid;
    position: absolute;
    top: -10px;
    bottom: 0px;
    cursor: pointer;
  }
}

$playAndPauseHeight: 10px;
$playAndPauseWidth: $playAndPauseHeight / 1.5;
.playAndPause {
  label {
    display: block;
    box-sizing: border-box;
    width: 0;
    height: $playAndPauseHeight + 2px;

    border-color: transparent transparent transparent #202020;
    cursor: pointer;
    border-style: double;
    border-width: 0 0 0 $playAndPauseHeight;
  }
  input[type="checkbox"] {
    position: absolute;
    left: -9999px;
    &:checked + label {
      border-style: solid;
      border-width: $playAndPauseWidth 0 $playAndPauseWidth $playAndPauseHeight;
    }
  }
}
</style>
