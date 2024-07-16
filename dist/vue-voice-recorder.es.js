var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { ref, computed, defineComponent, onMounted, renderSlot, unref, createElementVNode, openBlock, createElementBlock, createCommentVNode, Fragment, toDisplayString, normalizeClass } from "vue";
import { Mp3Encoder } from "lamejstmp";
const audioCtx = new (window.AudioContext || window["webkitAudioContext"])();
let analyser = audioCtx.createAnalyser();
const AudioContext = {
  getAudioContext() {
    return audioCtx;
  },
  startAnalyze(stream) {
    const audioCtx2 = AudioContext.getAudioContext();
    audioCtx2.resume().then(() => {
      const analyser2 = AudioContext.getAnalyser();
      const sourceNode = audioCtx2.createMediaStreamSource(stream);
      sourceNode.connect(analyser2);
    });
  },
  pauseAnalyze() {
    const audioCtx2 = AudioContext.getAudioContext();
    void audioCtx2.suspend();
  },
  resumeAnalyze() {
    const audioCtx2 = AudioContext.getAudioContext();
    void audioCtx2.resume();
  },
  getAnalyser() {
    return analyser;
  },
  resetAnalyser() {
    analyser = audioCtx.createAnalyser();
  }
};
const defaultOptions = {
  width: 300,
  height: 150,
  strokeColor: "#212121",
  backgroundColor: "white"
};
const AudioVisualizer = {
  visualizeSineWave({
    canvas,
    backgroundColor,
    strokeColor,
    width,
    height
  }) {
    const canvasCtx = canvas.getContext("2d");
    let analyser2 = AudioContext.getAnalyser();
    const bufferLength = analyser2.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    canvasCtx.clearRect(0, 0, width, height);
    function draw() {
      requestAnimationFrame(draw);
      analyser2 = AudioContext.getAnalyser();
      analyser2.getByteTimeDomainData(dataArray);
      canvasCtx.fillStyle = backgroundColor;
      canvasCtx.fillRect(0, 0, width, height);
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = strokeColor;
      canvasCtx.beginPath();
      const sliceWidth = width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128;
        const y = v * height / 2;
        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    }
    draw();
  },
  visualizeFrequencyBars({
    canvas,
    backgroundColor,
    strokeColor,
    width,
    height
  }) {
    const canvasCtx = canvas.getContext("2d");
    let analyser2 = AudioContext.getAnalyser();
    analyser2.fftSize = 256;
    const bufferLength = analyser2.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    canvasCtx.clearRect(0, 0, width, height);
    const draw = () => {
      requestAnimationFrame(draw);
      analyser2 = AudioContext.getAnalyser();
      analyser2.getByteFrequencyData(dataArray);
      canvasCtx.fillStyle = backgroundColor;
      canvasCtx.fillRect(0, 0, width, height);
      const barWidth = width / bufferLength * 2.5;
      let barHeight;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];
        this.hexToRgb(strokeColor);
        canvasCtx.fillStyle = strokeColor;
        canvasCtx.fillRect(x, height - barHeight / 2, barWidth, barHeight / 2);
        x += barWidth + 1;
      }
    };
    draw();
  },
  visualizeFrequencyCircles({
    canvas,
    backgroundColor,
    strokeColor,
    width,
    height
  }) {
    const canvasCtx = canvas.getContext("2d");
    let analyser2 = AudioContext.getAnalyser();
    analyser2.fftSize = 32;
    const bufferLength = analyser2.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    canvasCtx.clearRect(0, 0, width, height);
    const draw = () => {
      requestAnimationFrame(draw);
      analyser2 = AudioContext.getAnalyser();
      analyser2.getByteFrequencyData(dataArray);
      const reductionAmount = 3;
      const reducedDataArray = new Uint8Array(bufferLength / reductionAmount);
      for (let i = 0; i < bufferLength; i += reductionAmount) {
        let sum = 0;
        for (let j = 0; j < reductionAmount; j++) {
          sum += dataArray[i + j];
        }
        reducedDataArray[i / reductionAmount] = sum / reductionAmount;
      }
      canvasCtx.clearRect(0, 0, width, height);
      canvasCtx.beginPath();
      canvasCtx.arc(width / 2, height / 2, Math.min(height, width) / 2, 0, 2 * Math.PI);
      canvasCtx.fillStyle = backgroundColor;
      canvasCtx.fill();
      const stepSize = Math.min(height, width) / 2 / reducedDataArray.length;
      canvasCtx.strokeStyle = strokeColor;
      for (let i = 0; i < reducedDataArray.length; i++) {
        canvasCtx.beginPath();
        const normalized = reducedDataArray[i] / 128;
        const r = stepSize * i + stepSize * normalized;
        canvasCtx.arc(width / 2, height / 2, r, 0, 2 * Math.PI);
        canvasCtx.stroke();
      }
    };
    draw();
  },
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },
  visualize(type, options) {
    this[`visualize${type || "SineWave"}`](__spreadValues(__spreadValues({}, defaultOptions), options));
  }
};
class MP3Encoder {
  constructor(config) {
    __publicField(this, "config");
    __publicField(this, "mp3Encoder");
    __publicField(this, "maxSamples");
    __publicField(this, "samplesMono");
    __publicField(this, "dataBuffer", []);
    this.config = {
      sampleRate: 44100,
      bitRate: 128
    };
    Object.assign(this.config, config);
    this.mp3Encoder = new Mp3Encoder(1, this.config.sampleRate, this.config.bitRate);
    this.maxSamples = 1152;
    this.samplesMono = null;
    this.clearBuffer();
  }
  clearBuffer() {
    this.dataBuffer = [];
  }
  appendToBuffer(buffer) {
    this.dataBuffer.push(new Int8Array(buffer));
  }
  floatTo16BitPCM(input, output) {
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 32768 : s * 32767;
    }
  }
  convertBuffer(arrayBuffer) {
    const data = new Float32Array(arrayBuffer);
    const out = new Int16Array(arrayBuffer.length);
    this.floatTo16BitPCM(data, out);
    return out;
  }
  encode(arrayBuffer) {
    this.samplesMono = this.convertBuffer(arrayBuffer);
    let remaining = this.samplesMono.length;
    for (let i = 0; remaining >= 0; i += this.maxSamples) {
      const left = this.samplesMono.subarray(i, i + this.maxSamples);
      const mp3buffer = this.mp3Encoder.encodeBuffer(left);
      this.appendToBuffer(mp3buffer);
      remaining -= this.maxSamples;
    }
  }
  finish() {
    this.appendToBuffer(this.mp3Encoder.flush());
    return this.dataBuffer;
  }
}
const toHHMMSS = (seconds) => {
  return new Date(seconds * 1e3).toISOString().slice(11, 19);
};
const useRecorder = ({ afterStartRecording, afterStopRecording, afterPauseRecording, afterResumeRecording, getAsMp3 } = {}) => {
  const isRecording = ref(false);
  const isPaused = ref(false);
  const mediaRecorder = ref();
  const timerInterval = ref(null);
  const recordingBlob = ref();
  const recordingState = ref("inactive");
  const audioContext = new (window.AudioContext || window["webkitAudioContext"])();
  const mic = ref();
  const processor = ref();
  const activeStream = ref();
  const encoder = new MP3Encoder();
  const _recordingTime = ref(0);
  const recordingTime = computed(() => {
    return toHHMMSS(_recordingTime.value);
  });
  const _startTimer = () => {
    timerInterval.value = setInterval(() => {
      _recordingTime.value = _recordingTime.value + 1;
    }, 1e3);
  };
  const _stopTimer = () => {
    timerInterval.value != null && clearInterval(timerInterval.value);
    timerInterval.value = null;
  };
  const toggleStartAndStop = () => {
    if (isRecording.value) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  const startRecording = () => {
    if (timerInterval.value !== null)
      return;
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      activeStream.value = stream;
      isRecording.value = true;
      const recorder = new MediaRecorder(stream);
      mediaRecorder.value = recorder;
      recorder.start();
      _startTimer();
      recordingState.value = "recording";
      mic.value = audioContext.createMediaStreamSource(stream);
      processor.value = audioContext.createScriptProcessor(0, 1, 1);
      mic.value.connect(processor.value);
      processor.value.connect(audioContext.destination);
      processor.value.onaudioprocess = (event) => {
        encoder.encode(event.inputBuffer.getChannelData(0));
      };
      if (afterStartRecording)
        afterStartRecording();
      recorder.addEventListener("dataavailable", (event) => {
        recordingBlob.value = event.data;
        recorder.stream.getTracks().forEach((t) => t.stop());
        mediaRecorder.value = null;
        if (afterStopRecording)
          afterStopRecording(event.data);
        if (getAsMp3) {
          getMp3().then((data) => getAsMp3({ data, url: URL.createObjectURL(data) }));
        }
      });
      AudioContext.startAnalyze(stream);
    }).catch((err) => console.log(err));
  };
  const getMp3 = () => {
    const finalBuffer = encoder.finish();
    return new Promise((resolve, reject) => {
      if (finalBuffer.length === 0) {
        reject(new Error("No buffer to send"));
      } else {
        resolve(new Blob(finalBuffer, { type: "audio/mp3" }));
        encoder.clearBuffer();
      }
    });
  };
  const stopRecording = () => {
    var _a, _b;
    (_a = mediaRecorder.value) == null ? void 0 : _a.stop();
    _stopTimer();
    _recordingTime.value = 0;
    isRecording.value = false;
    isPaused.value = false;
    recordingState.value = "inactive";
    AudioContext.resetAnalyser();
    if (processor.value && mic.value) {
      mic.value.disconnect();
      processor.value.disconnect();
      if (audioContext && audioContext.state !== "closed") {
        audioContext.close();
      }
      processor.value.onaudioprocess = null;
      (_b = activeStream.value) == null ? void 0 : _b.getAudioTracks().forEach((track) => track.stop());
    }
  };
  const togglePauseAndResume = () => {
    if (isPaused.value) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  };
  const pauseRecording = () => {
    var _a;
    isPaused.value = true;
    recordingState.value = "paused";
    AudioContext.pauseAnalyze();
    (_a = mediaRecorder.value) == null ? void 0 : _a.pause();
    audioContext.suspend();
    _stopTimer();
    if (afterPauseRecording)
      afterPauseRecording();
  };
  const resumeRecording = () => {
    var _a;
    isPaused.value = false;
    (_a = mediaRecorder.value) == null ? void 0 : _a.resume();
    recordingState.value = "recording";
    AudioContext.resumeAnalyze();
    audioContext.resume();
    _startTimer();
    if (afterResumeRecording)
      afterResumeRecording();
  };
  return {
    startRecording,
    stopRecording,
    togglePauseAndResume,
    pauseRecording,
    resumeRecording,
    toggleStartAndStop,
    recordingBlob,
    isRecording,
    isPaused,
    recordingTime,
    recordingState
  };
};
var VueVoiceRecording_vue_vue_type_style_index_0_lang = "";
const _hoisted_1 = { class: "vue-voice-recorder" };
const _hoisted_2 = { class: "vue-voice-recorder__container" };
const _hoisted_3 = { class: "vue-voice-recorder__state" };
const _hoisted_4 = {
  key: 0,
  class: "vue-voice-recorder__stop"
};
const _hoisted_5 = {
  key: 1,
  class: "vue-voice-recorder__start",
  xmlns: "http://www.w3.org/2000/svg",
  "xmlns:xlink": "http://www.w3.org/1999/xlink",
  "aria-hidden": "true",
  preserveAspectRatio: "xMidYMid meet",
  viewBox: "0 0 24 24"
};
const _hoisted_6 = /* @__PURE__ */ createElementVNode("path", {
  fill: "currentColor",
  d: "M12 14q-1.25 0-2.125-.875T9 11V5q0-1.25.875-2.125T12 2q1.25 0 2.125.875T15 5v6q0 1.25-.875 2.125T12 14Zm-1 7v-3.075q-2.6-.35-4.3-2.325Q5 13.625 5 11h2q0 2.075 1.463 3.537Q9.925 16 12 16t3.538-1.463Q17 13.075 17 11h2q0 2.625-1.7 4.6q-1.7 1.975-4.3 2.325V21Z"
}, null, -1);
const _hoisted_7 = [
  _hoisted_6
];
const _hoisted_8 = { class: "vue-voice-recorder__recording-time" };
const _sfc_main = /* @__PURE__ */ defineComponent({
  props: {
    showVisualization: {
      type: Boolean,
      default: true
    },
    visualizationType: {
      type: String,
      default: "SineWave"
    },
    visualizationOptions: {
      type: Object,
      default: {}
    }
  },
  emits: [
    "afterStartRecording",
    "afterStopRecording",
    "afterPauseRecording",
    "afterResumeRecording",
    "getAsMp3"
  ],
  setup(__props, { emit: emits }) {
    const props = __props;
    const canvas = ref();
    const {
      isRecording,
      recordingTime,
      isPaused,
      recordingState,
      toggleStartAndStop,
      togglePauseAndResume,
      startRecording,
      stopRecording,
      pauseRecording,
      resumeRecording
    } = useRecorder({
      afterStartRecording: () => emits("afterStartRecording"),
      afterStopRecording: (blob) => emits("afterStartRecording", blob),
      afterPauseRecording: () => emits("afterPauseRecording"),
      afterResumeRecording: () => emits("afterResumeRecording"),
      getAsMp3: (data) => emits("getAsMp3", data)
    });
    onMounted(() => {
      if (props.showVisualization && canvas.value) {
        AudioVisualizer.visualize(props.visualizationType, __spreadValues({
          canvas: canvas.value
        }, props.visualizationOptions));
      }
    });
    return (_ctx, _cache) => {
      return renderSlot(_ctx.$slots, "default", {
        isRecording: unref(isRecording),
        isPaused: unref(isPaused),
        recordingTime: unref(recordingTime),
        recordingState: unref(recordingState),
        toggleStartAndStop: unref(toggleStartAndStop),
        togglePauseAndResume: unref(togglePauseAndResume),
        startRecording: unref(startRecording),
        stopRecording: unref(stopRecording),
        pauseRecording: unref(pauseRecording),
        resumeRecording: unref(resumeRecording)
      }, () => [
        createElementVNode("div", _hoisted_1, [
          createElementVNode("div", _hoisted_2, [
            createElementVNode("div", {
              class: "vue-voice-recorder__start-and-stop",
              onClick: _cache[0] || (_cache[0] = (...args) => unref(toggleStartAndStop) && unref(toggleStartAndStop)(...args))
            }, [
              createElementVNode("div", _hoisted_3, [
                unref(isRecording) ? (openBlock(), createElementBlock("span", _hoisted_4)) : createCommentVNode("", true),
                !unref(isRecording) ? (openBlock(), createElementBlock("svg", _hoisted_5, _hoisted_7)) : createCommentVNode("", true)
              ])
            ]),
            unref(isRecording) ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
              createElementVNode("div", _hoisted_8, toDisplayString(unref(recordingTime)), 1),
              createElementVNode("div", {
                class: "vue-voice-recorder__pause-and-resume",
                onClick: _cache[1] || (_cache[1] = (...args) => unref(togglePauseAndResume) && unref(togglePauseAndResume)(...args))
              }, [
                createElementVNode("span", {
                  class: normalizeClass([!unref(isPaused) && "vue-voice-recorder--blink"])
                }, null, 2),
                createElementVNode("p", null, toDisplayString(unref(recordingState)), 1)
              ])
            ], 64)) : createCommentVNode("", true)
          ]),
          props.showVisualization ? (openBlock(), createElementBlock("canvas", {
            key: 0,
            class: normalizeClass([!unref(isRecording) && "visualization--hidden"]),
            ref_key: "canvas",
            ref: canvas
          }, null, 2)) : createCommentVNode("", true)
        ])
      ]);
    };
  }
});
var components = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  VueVoiceRecording: _sfc_main
});
var main = "";
function install(app) {
  for (const key in components) {
    app.component(key, components[key]);
  }
}
var index = { install };
export { AudioContext, AudioVisualizer, MP3Encoder, _sfc_main as VueVoiceRecording, index as default, useRecorder };
