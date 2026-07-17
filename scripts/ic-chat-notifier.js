const MODULE_ID = "ic-chat-notifier";

const SETTINGS = Object.freeze({
  ENABLED: "enabled",
  USE_WORLD_SOUNDS: "useWorldSounds",
  NORMAL_SOUND: "normalSound",
  NORMAL_VOLUME: "normalVolume",
  MENTION_ENABLED: "mentionEnabled",
  MENTION_MODE: "mentionMode",
  ALIASES: "aliases",
  MENTION_SOUND: "mentionSound",
  MENTION_VOLUME: "mentionVolume",
  WORLD_NORMAL_SOUND: "worldNormalSound",
  WORLD_NORMAL_VOLUME: "worldNormalVolume",
  WORLD_MENTION_SOUND: "worldMentionSound",
  WORLD_MENTION_VOLUME: "worldMentionVolume"
});

const MENTION_MODES = Object.freeze({
  NAME_OR_AT: "name-or-at",
  AT_ONLY: "at-only"
});

const processedMessages = new WeakSet();

const {ApplicationV2, HandlebarsApplicationMixin} = foundry.applications.api;

class ICChatNotifierSettings extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ic-chat-notifier-settings",
    classes: ["icn-settings-window"],
    tag: "section",
    window: {
      title: "ICN.Settings.WindowTitle",
      icon: "fa-solid fa-bell"
    },
    position: {
      width: 560,
      height: "auto"
    }
  };

  static PARTS = {
    body: {
      template: `modules/${MODULE_ID}/templates/settings.hbs`
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const mentionMode = getSetting(SETTINGS.MENTION_MODE);
    return Object.assign(context, {
      isGM: game.user.isGM,
      enabled: getSetting(SETTINGS.ENABLED),
      useWorldSounds: getSetting(SETTINGS.USE_WORLD_SOUNDS),
      normalSound: getSetting(SETTINGS.NORMAL_SOUND),
      normalVolume: getSetting(SETTINGS.NORMAL_VOLUME),
      mentionEnabled: getSetting(SETTINGS.MENTION_ENABLED),
      mentionMode,
      nameOrAtSelected: mentionMode === MENTION_MODES.NAME_OR_AT,
      atOnlySelected: mentionMode === MENTION_MODES.AT_ONLY,
      aliases: getSetting(SETTINGS.ALIASES),
      mentionSound: getSetting(SETTINGS.MENTION_SOUND),
      mentionVolume: getSetting(SETTINGS.MENTION_VOLUME),
      worldNormalSound: getSetting(SETTINGS.WORLD_NORMAL_SOUND),
      worldNormalVolume: getSetting(SETTINGS.WORLD_NORMAL_VOLUME),
      worldMentionSound: getSetting(SETTINGS.WORLD_MENTION_SOUND),
      worldMentionVolume: getSetting(SETTINGS.WORLD_MENTION_VOLUME),
      detectedNames: getCurrentUserNames().join(", ")
    });
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    activateSettingsListeners(this.element, this);
  }
}

Hooks.once("init", () => {
  registerSettings();
});

Hooks.on("createChatMessage", (message) => {
  void handleIncomingMessage(message);
});

function registerSettings() {
  game.settings.registerMenu(MODULE_ID, "notificationSettings", {
    name: "ICN.Settings.Menu.Name",
    label: "ICN.Settings.Menu.Label",
    hint: "ICN.Settings.Menu.Hint",
    icon: "fa-solid fa-bell",
    type: ICChatNotifierSettings,
    restricted: false
  });

  registerSetting(SETTINGS.ENABLED, {
    name: "ICN.Settings.Enabled.Name",
    hint: "ICN.Settings.Enabled.Hint",
    type: Boolean,
    default: true
  });

  registerSetting(SETTINGS.USE_WORLD_SOUNDS, {
    name: "ICN.Settings.UseWorldSounds.Name",
    hint: "ICN.Settings.UseWorldSounds.Hint",
    type: Boolean,
    default: true
  });

  registerSetting(SETTINGS.NORMAL_SOUND, {
    name: "ICN.Settings.NormalSound.Name",
    hint: "ICN.Settings.NormalSound.Hint",
    type: String,
    filePicker: "audio",
    default: "sounds/notify.wav"
  });

  registerSetting(SETTINGS.NORMAL_VOLUME, {
    name: "ICN.Settings.NormalVolume.Name",
    hint: "ICN.Settings.NormalVolume.Hint",
    type: Number,
    range: {min: 0, max: 1, step: 0.05},
    default: 0.45
  });

  registerSetting(SETTINGS.MENTION_ENABLED, {
    name: "ICN.Settings.MentionEnabled.Name",
    hint: "ICN.Settings.MentionEnabled.Hint",
    type: Boolean,
    default: true
  });

  registerSetting(SETTINGS.MENTION_MODE, {
    name: "ICN.Settings.MentionMode.Name",
    hint: "ICN.Settings.MentionMode.Hint",
    type: String,
    choices: {
      [MENTION_MODES.NAME_OR_AT]: game.i18n.localize("ICN.Settings.MentionMode.NameOrAt"),
      [MENTION_MODES.AT_ONLY]: game.i18n.localize("ICN.Settings.MentionMode.AtOnly")
    },
    default: MENTION_MODES.NAME_OR_AT
  });

  registerSetting(SETTINGS.ALIASES, {
    name: "ICN.Settings.Aliases.Name",
    hint: "ICN.Settings.Aliases.Hint",
    type: String,
    default: ""
  });

  registerSetting(SETTINGS.MENTION_SOUND, {
    name: "ICN.Settings.MentionSound.Name",
    hint: "ICN.Settings.MentionSound.Hint",
    type: String,
    filePicker: "audio",
    default: "sounds/lock.wav"
  });

  registerSetting(SETTINGS.MENTION_VOLUME, {
    name: "ICN.Settings.MentionVolume.Name",
    hint: "ICN.Settings.MentionVolume.Hint",
    type: Number,
    range: {min: 0, max: 1, step: 0.05},
    default: 0.7
  });

  registerWorldSetting(SETTINGS.WORLD_NORMAL_SOUND, {
    name: "ICN.Settings.WorldNormalSound.Name",
    hint: "ICN.Settings.WorldNormalSound.Hint",
    type: String,
    filePicker: "audio",
    default: "sounds/notify.wav"
  });

  registerWorldSetting(SETTINGS.WORLD_NORMAL_VOLUME, {
    name: "ICN.Settings.WorldNormalVolume.Name",
    hint: "ICN.Settings.WorldNormalVolume.Hint",
    type: Number,
    range: {min: 0, max: 1, step: 0.05},
    default: 0.45
  });

  registerWorldSetting(SETTINGS.WORLD_MENTION_SOUND, {
    name: "ICN.Settings.WorldMentionSound.Name",
    hint: "ICN.Settings.WorldMentionSound.Hint",
    type: String,
    filePicker: "audio",
    default: "sounds/lock.wav"
  });

  registerWorldSetting(SETTINGS.WORLD_MENTION_VOLUME, {
    name: "ICN.Settings.WorldMentionVolume.Name",
    hint: "ICN.Settings.WorldMentionVolume.Hint",
    type: Number,
    range: {min: 0, max: 1, step: 0.05},
    default: 0.7
  });
}

function registerSetting(key, data) {
  game.settings.register(MODULE_ID, key, {
    scope: "client",
    config: false,
    ...data
  });
}

function registerWorldSetting(key, data) {
  game.settings.register(MODULE_ID, key, {
    scope: "world",
    config: false,
    ...data
  });
}

function getSetting(key) {
  return game.settings.get(MODULE_ID, key);
}

function activateSettingsListeners(root, app) {
  const form = root.querySelector("form");
  if (!form) return;

  const useWorldSounds = form.elements.namedItem(SETTINGS.USE_WORLD_SOUNDS);
  const personalSoundSections = form.querySelectorAll("[data-personal-sound-section]");
  const mentionEnabled = form.elements.namedItem(SETTINGS.MENTION_ENABLED);
  const mentionSection = form.querySelector("[data-mention-section]");
  const updateControlStates = () => {
    const usesWorldSounds = Boolean(useWorldSounds?.checked);
    const mentionsDisabled = !mentionEnabled?.checked;
    personalSoundSections.forEach((section) => {
      section.classList.toggle("is-disabled", usesWorldSounds);
      section.querySelectorAll("input, button").forEach((control) => {
        const belongsToMentionSection = Boolean(control.closest("[data-mention-section]"));
        control.disabled = usesWorldSounds || (belongsToMentionSection && mentionsDisabled);
      });
    });
    mentionSection?.classList.toggle("is-disabled", mentionsDisabled);
    mentionSection?.querySelectorAll("input, select, button").forEach((control) => {
      if (!control.closest("[data-personal-sound-section]")) control.disabled = mentionsDisabled;
    });
  };
  useWorldSounds?.addEventListener("change", updateControlStates);
  mentionEnabled?.addEventListener("change", updateControlStates);
  updateControlStates();

  form.querySelectorAll("input[type='range']").forEach((input) => {
    const output = form.querySelector(`[data-volume-output="${input.name}"]`);
    const updateOutput = () => {
      if (output) output.textContent = `${Math.round(Number(input.value) * 100)}%`;
    };
    input.addEventListener("input", updateOutput);
    updateOutput();
  });

  form.querySelectorAll("[data-file-picker]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const input = form.elements.namedItem(event.currentTarget.dataset.filePicker);
      if (!(input instanceof HTMLInputElement)) return;
      new FilePicker({
        type: "audio",
        current: input.value,
        callback: (path) => {
          input.value = path;
          input.dispatchEvent(new Event("change", {bubbles: true}));
        }
      }).render(true);
    });
  });

  form.querySelectorAll("[data-test-sound]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      const kind = event.currentTarget.dataset.testSound;
      const soundKey = kind === "mention" ? SETTINGS.MENTION_SOUND : SETTINGS.NORMAL_SOUND;
      const volumeKey = kind === "mention" ? SETTINGS.MENTION_VOLUME : SETTINGS.NORMAL_VOLUME;
      const soundInput = form.elements.namedItem(soundKey);
      const volumeInput = form.elements.namedItem(volumeKey);
      await playPreviewSound(soundInput?.value, volumeInput?.value);
    });
  });

  form.querySelectorAll("[data-test-world-sound]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      const kind = event.currentTarget.dataset.testWorldSound;
      const soundKey = kind === "mention" ? SETTINGS.WORLD_MENTION_SOUND : SETTINGS.WORLD_NORMAL_SOUND;
      const volumeKey = kind === "mention" ? SETTINGS.WORLD_MENTION_VOLUME : SETTINGS.WORLD_NORMAL_VOLUME;
      const soundInput = form.elements.namedItem(soundKey);
      const volumeInput = form.elements.namedItem(volumeKey);
      const sound = soundInput?.value ?? getSetting(soundKey);
      const volume = volumeInput?.value ?? getSetting(volumeKey);
      await playPreviewSound(sound, volume);
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector("button[type='submit']");
    if (submitButton) submitButton.disabled = true;

    try {
      const valueOf = (key) => form.elements.namedItem(key)?.value;
      const updates = [
        setSetting(SETTINGS.ENABLED, Boolean(form.elements.namedItem(SETTINGS.ENABLED)?.checked)),
        setSetting(SETTINGS.USE_WORLD_SOUNDS, Boolean(useWorldSounds?.checked)),
        setSetting(SETTINGS.NORMAL_SOUND, String(valueOf(SETTINGS.NORMAL_SOUND) ?? "").trim()),
        setSetting(SETTINGS.NORMAL_VOLUME, Number(valueOf(SETTINGS.NORMAL_VOLUME))),
        setSetting(SETTINGS.MENTION_ENABLED, Boolean(mentionEnabled?.checked)),
        setSetting(SETTINGS.MENTION_MODE, String(valueOf(SETTINGS.MENTION_MODE))),
        setSetting(SETTINGS.ALIASES, String(valueOf(SETTINGS.ALIASES) ?? "").trim()),
        setSetting(SETTINGS.MENTION_SOUND, String(valueOf(SETTINGS.MENTION_SOUND) ?? "").trim()),
        setSetting(SETTINGS.MENTION_VOLUME, Number(valueOf(SETTINGS.MENTION_VOLUME)))
      ];
      if (game.user.isGM) {
        updates.push(
          setSetting(SETTINGS.WORLD_NORMAL_SOUND, String(valueOf(SETTINGS.WORLD_NORMAL_SOUND) ?? "").trim()),
          setSetting(SETTINGS.WORLD_NORMAL_VOLUME, Number(valueOf(SETTINGS.WORLD_NORMAL_VOLUME))),
          setSetting(SETTINGS.WORLD_MENTION_SOUND, String(valueOf(SETTINGS.WORLD_MENTION_SOUND) ?? "").trim()),
          setSetting(SETTINGS.WORLD_MENTION_VOLUME, Number(valueOf(SETTINGS.WORLD_MENTION_VOLUME)))
        );
      }
      await Promise.all(updates);
      ui.notifications.info(game.i18n.localize("ICN.Settings.Saved"));
      await app.close();
    } catch (error) {
      Hooks.onError(`${MODULE_ID}.saveSettings`, error, {log: "error", notify: "error"});
      if (submitButton) submitButton.disabled = false;
    }
  });
}

function setSetting(key, value) {
  return game.settings.set(MODULE_ID, key, value);
}

async function playPreviewSound(sound, volume) {
  if (!sound) {
    ui.notifications.warn(game.i18n.localize("ICN.Settings.NoSound"));
    return;
  }

  try {
    await game.audio.play(sound, {
      context: game.audio.interface,
      volume: Math.clamp(Number(volume) || 0, 0, 1)
    });
  } catch (error) {
    Hooks.onError(`${MODULE_ID}.playPreviewSound`, error, {log: "warn", notify: "warning"});
  }
}

async function handleIncomingMessage(message) {
  if (!message || typeof message !== "object" || processedMessages.has(message)) return;
  processedMessages.add(message);

  try {
    if (!shouldNotify(message)) return;

    const isMention = getSetting(SETTINGS.MENTION_ENABLED)
      && isMessageForCurrentUser(message);
    const {sound, volume} = getNotificationSound(isMention);

    if (!sound) return;
    await game.audio.play(sound, {
      context: game.audio.interface,
      volume: Math.clamp(Number(volume) || 0, 0, 1)
    });
  } catch (error) {
    Hooks.onError(`${MODULE_ID}.handleIncomingMessage`, error, {
      log: "warn",
      notify: null
    });
  }
}

function getNotificationSound(isMention) {
  const useWorldSounds = getSetting(SETTINGS.USE_WORLD_SOUNDS);
  const soundKey = useWorldSounds
    ? (isMention ? SETTINGS.WORLD_MENTION_SOUND : SETTINGS.WORLD_NORMAL_SOUND)
    : (isMention ? SETTINGS.MENTION_SOUND : SETTINGS.NORMAL_SOUND);
  const volumeKey = useWorldSounds
    ? (isMention ? SETTINGS.WORLD_MENTION_VOLUME : SETTINGS.WORLD_NORMAL_VOLUME)
    : (isMention ? SETTINGS.MENTION_VOLUME : SETTINGS.NORMAL_VOLUME);
  return {
    sound: getSetting(soundKey),
    volume: getSetting(volumeKey)
  };
}

function shouldNotify(message) {
  if (!getSetting(SETTINGS.ENABLED)) return false;
  if (!message?.visible || message.isAuthor) return false;
  if (message.style !== CONST.CHAT_MESSAGE_STYLES.IC) return false;

  const messageSceneId = message.speaker?.scene;
  const viewedSceneId = canvas?.scene?.id ?? game.user?.viewedScene;
  return Boolean(messageSceneId && viewedSceneId && messageSceneId === viewedSceneId);
}

function isMessageForCurrentUser(message) {
  if (message.whisper?.includes(game.user.id)) return true;

  const text = htmlToText(message.content);
  if (!text) return false;

  const mode = getSetting(SETTINGS.MENTION_MODE);
  return getCurrentUserNames().some((name) => containsRecipientName(text, name, mode));
}

function getCurrentUserNames() {
  const names = [game.user?.name, game.user?.character?.name];
  const ownerLevel = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;

  if (!game.user?.isGM) {
    for (const actor of game.actors ?? []) {
      if (actor.ownership?.[game.user.id] === ownerLevel) names.push(actor.name);
    }
  }

  const aliases = getSetting(SETTINGS.ALIASES);
  names.push(...String(aliases ?? "").split(/[,;\n]/));

  const locale = game.i18n.lang || "en";
  const uniqueNames = new Map();
  for (const value of names) {
    const name = String(value ?? "").trim().replace(/^@+/, "");
    if (!name) continue;
    uniqueNames.set(name.normalize("NFKC").toLocaleLowerCase(locale), name);
  }
  return [...uniqueNames.values()];
}

function containsRecipientName(text, name, mode) {
  const locale = game.i18n.lang || "en";
  const normalizedText = text.normalize("NFKC").toLocaleLowerCase(locale);
  const normalizedName = name.normalize("NFKC").toLocaleLowerCase(locale);
  const escapedName = escapeRegExp(normalizedName);
  const prefix = mode === MENTION_MODES.AT_ONLY ? "@" : "@?";
  const pattern = new RegExp(
    `(^|[^\\p{L}\\p{N}_])${prefix}${escapedName}(?=$|[^\\p{L}\\p{N}_])`,
    "u"
  );
  return pattern.test(normalizedText);
}

function htmlToText(html) {
  const element = document.createElement("div");
  element.innerHTML = String(html ?? "");
  return element.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
