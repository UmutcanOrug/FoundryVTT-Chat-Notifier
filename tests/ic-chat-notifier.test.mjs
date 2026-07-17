import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const hooks = {};
const registered = new Map();
const values = new Map();
const played = [];
const streamed = [];

Math.clamp = (value, min, max) => Math.min(max, Math.max(min, value));

class MockApplicationV2 {
  async _prepareContext() { return {}; }
  async _onRender() {}
}

globalThis.foundry = {
  applications: {
    api: {
      ApplicationV2: MockApplicationV2,
      HandlebarsApplicationMixin: Base => class extends Base {}
    }
  }
};
globalThis.Audio = class MockAudio {
  constructor(source) {
    this.src = source;
    this.volume = 1;
    this.played = false;
    streamed.push(this);
  }

  addEventListener() {}

  async play() {
    this.played = true;
  }
};
globalThis.Hooks = {
  once: (name, fn) => { hooks[name] = fn; },
  on: (name, fn) => { hooks[name] = fn; },
  onError: (_name, error) => { throw error; }
};
globalThis.CONST = {
  CHAT_MESSAGE_STYLES: {IC: 2, OOC: 1},
  DOCUMENT_OWNERSHIP_LEVELS: {OWNER: 3}
};
globalThis.canvas = {scene: {id: "scene-a"}};
globalThis.game = {
  user: {id: "user-a", name: "Oyuncu", isGM: false, character: {name: "Alaric Grey"}},
  actors: [{name: "Victoire Solenne", ownership: {"user-a": 3}}],
  i18n: {lang: "tr", localize: key => key},
  settings: {
    registerMenu: () => {},
    register: (moduleId, key, data) => registered.set(`${moduleId}.${key}`, data),
    get: (moduleId, key) => values.has(`${moduleId}.${key}`)
      ? values.get(`${moduleId}.${key}`)
      : registered.get(`${moduleId}.${key}`).default,
    set: (moduleId, key, value) => values.set(`${moduleId}.${key}`, value)
  },
  audio: {
    interface: {},
    globalMute: false,
    play: async (sound, options) => played.push({sound, options})
  }
};
globalThis.document = {
  createElement: () => {
    let content = "";
    return {
      set innerHTML(value) { content = String(value).replace(/<[^>]*>/g, " "); },
      get textContent() { return content; }
    };
  }
};

const source = fs.readFileSync(new URL("../scripts/ic-chat-notifier.js", import.meta.url), "utf8")
  + "\nglobalThis.icnTestApi = {shouldNotify, isMessageForCurrentUser, handleIncomingMessage, getNotificationSound};";
const templateSource = fs.readFileSync(new URL("../templates/settings.hbs", import.meta.url), "utf8");
const styleSource = fs.readFileSync(new URL("../styles/ic-chat-notifier.css", import.meta.url), "utf8");
vm.runInThisContext(source, {filename: "ic-chat-notifier.js"});
hooks.init();

function message(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    visible: true,
    isAuthor: false,
    style: 2,
    speaker: {scene: "scene-a"},
    content: "Genel konuşma.",
    whisper: [],
    ...overrides
  };
}

test("only incoming IC messages from the viewed scene qualify", () => {
  assert.equal(icnTestApi.shouldNotify(message()), true);
  assert.equal(icnTestApi.shouldNotify(message({speaker: {scene: "scene-b"}})), false);
  assert.equal(icnTestApi.shouldNotify(message({speaker: {scene: null}})), false);
  assert.equal(icnTestApi.shouldNotify(message({style: 1})), false);
  assert.equal(icnTestApi.shouldNotify(message({isAuthor: true})), false);
});

test("full character names, first names, and name suffixes are detected", () => {
  assert.equal(icnTestApi.isMessageForCurrentUser(message({content: "Merhaba Alaric Grey."})), true);
  assert.equal(icnTestApi.isMessageForCurrentUser(message({content: "Merhaba Alaric."})), true);
  assert.equal(icnTestApi.isMessageForCurrentUser(message({content: "Merhaba @Victoire!"})), true);
  assert.equal(icnTestApi.isMessageForCurrentUser(message({content: "Alaricson geldi."})), true);
  assert.equal(icnTestApi.isMessageForCurrentUser(message({content: "XAlaric geldi."})), false);
});

test("at-only mode requires the @ sign", () => {
  values.set("ic-chat-notifier.mentionMode", "at-only");
  assert.equal(icnTestApi.isMessageForCurrentUser(message({content: "Merhaba Alaric."})), false);
  assert.equal(icnTestApi.isMessageForCurrentUser(message({content: "Merhaba @Alaric."})), true);
  values.set("ic-chat-notifier.mentionMode", "name-or-at");
});

test("five mentions in one message play exactly one mention sound and no normal sound", async () => {
  const incoming = message({content: "Alaric, @Alaric, Alaric, Victoire ve @Victoire!"});
  const before = played.length;

  await icnTestApi.handleIncomingMessage(incoming);

  const sounds = played.slice(before).map(entry => entry.sound);
  assert.deepEqual(sounds, ["sounds/lock.wav"]);
});

test("the same ChatMessage object cannot produce a duplicate sound", async () => {
  const incoming = message({content: "@Alaric"});
  const before = played.length;

  await icnTestApi.handleIncomingMessage(incoming);
  await icnTestApi.handleIncomingMessage(incoming);

  assert.equal(played.length - before, 1);
});

test("a non-targeted message plays exactly one normal sound", async () => {
  const before = played.length;
  await icnTestApi.handleIncomingMessage(message({content: "Herkese merhaba."}));
  assert.deepEqual(played.slice(before).map(entry => entry.sound), ["sounds/notify.wav"]);
});

test("disabling mention sounds makes a targeted message use one normal sound", async () => {
  values.set("ic-chat-notifier.mentionEnabled", false);
  const before = played.length;

  await icnTestApi.handleIncomingMessage(message({content: "@Alaric"}));

  assert.deepEqual(played.slice(before).map(entry => entry.sound), ["sounds/notify.wav"]);
  values.set("ic-chat-notifier.mentionEnabled", true);
});

test("out-of-scene and disabled notifications never reach the audio player", async () => {
  const before = played.length;
  await icnTestApi.handleIncomingMessage(message({speaker: {scene: "scene-b"}, content: "@Alaric"}));
  values.set("ic-chat-notifier.enabled", false);
  await icnTestApi.handleIncomingMessage(message({content: "@Alaric"}));
  values.set("ic-chat-notifier.enabled", true);

  assert.equal(played.length, before);
});

test("players may override GM world sounds without changing detection", async () => {
  values.set("ic-chat-notifier.useWorldSounds", false);
  values.set("ic-chat-notifier.mentionSound", "custom/player-mention.ogg");
  values.set("ic-chat-notifier.mentionVolume", 0.35);
  const before = played.length;

  await icnTestApi.handleIncomingMessage(message({content: "@Alaric"}));

  assert.deepEqual(played.slice(before).map(entry => entry.sound), ["custom/player-mention.ogg"]);
  assert.equal(played.at(-1).options.volume, 0.35);
  values.set("ic-chat-notifier.useWorldSounds", true);
});

test("remote Forge audio is streamed once instead of being decoded as a local sound", async () => {
  const remoteSound = "https://assets.forge-vtt.com/62f57b3e2579d0a019e346d6/Firebrand%20Judgement.mp3";
  values.set("ic-chat-notifier.worldMentionSound", remoteSound);
  values.set("ic-chat-notifier.worldMentionVolume", 0.65);
  const beforeLocal = played.length;
  const beforeStreamed = streamed.length;

  await icnTestApi.handleIncomingMessage(message({content: "@Alaric"}));

  assert.equal(played.length, beforeLocal);
  assert.equal(streamed.length - beforeStreamed, 1);
  assert.equal(streamed.at(-1).src, remoteSound);
  assert.equal(streamed.at(-1).volume, 0.65);
  assert.equal(streamed.at(-1).played, true);
  values.delete("ic-chat-notifier.worldMentionSound");
  values.delete("ic-chat-notifier.worldMentionVolume");
});

test("settings use Foundry V13 native audio file pickers", () => {
  assert.equal(templateSource.match(/<file-picker\b[^>]*type="audio"/g)?.length, 4);
  assert.equal(templateSource.includes("data-file-picker="), false);
});

test("settings content scrolls while the save footer remains outside the scroll area", () => {
  const scrollEnd = templateSource.indexOf("</div>\n\n  <footer>");
  assert.ok(templateSource.includes('class="icn-settings-scroll" data-scrollable'));
  assert.ok(scrollEnd > 0);
  assert.match(styleSource, /\.icn-settings-scroll\s*\{[^}]*overflow-y:\s*auto;/s);
  assert.match(styleSource, /\.icn-settings-form footer\s*\{[^}]*flex:\s*0 0 auto;/s);
});
