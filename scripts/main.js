const MODULE_ID = "argon-apothecary-compat";
const ARGON_DND5E_ID = "enhancedcombathud-dnd5e";

const BUILTIN_METHODS = new Set(["spell", "pact", "atwill", "innate"]);
const PANEL_CONFIG = {
  "DND5E.Action": { activationTypes: ["action"], color: 0 },
  "DND5E.BonusAction": { activationTypes: ["bonus"], color: 1 },
  "DND5E.Reaction": { activationTypes: ["reaction", "reactiondamage", "reactionmanual"], color: 3 },
  "DND5E.Special": { activationTypes: ["special"], color: 2 }
};

function log(...args) {
  console.log(`${MODULE_ID} |`, ...args);
}

function warn(...args) {
  console.warn(`${MODULE_ID} |`, ...args);
}

function getFirstActivity(item) {
  const activities = item?.system?.activities;
  if (!activities) return null;
  return Array.from(activities)[0] ?? null;
}

function getActivationType(item) {
  return getFirstActivity(item)?.activation?.type ?? null;
}

function shouldShowPreparedOnly(actor) {
  if (actor?.type !== "character") return false;

  const preparedFlag = actor.getFlag(ARGON_DND5E_ID, "showPrepared");
  if (preparedFlag === "all") return false;

  if (preparedFlag === "auto") {
    const classes = Object.keys(actor.classes ?? {});
    return ["cleric", "druid", "paladin", "wizard", "artificer"].some(className => classes.includes(className));
  }

  return true;
}

function getSpellcastingModel(method) {
  return CONFIG.DND5E?.spellcasting?.[method] ?? null;
}

function getSlotKey(item) {
  const method = item?.system?.method;
  const level = Number(item?.system?.level ?? 0);
  const model = getSpellcastingModel(method);

  try {
    return model?.getSpellSlotKey?.(level) ?? method;
  } catch (err) {
    warn(`Could not resolve slot key for spellcasting method "${method}" at level ${level}.`, err);
    return method;
  }
}

function getSlotData(actor, item) {
  const slotKey = getSlotKey(item);
  return actor?.system?.spells?.[slotKey] ?? null;
}

function localizeMaybe(value) {
  if (!value) return "";
  if (typeof value !== "string") return String(value);
  const localized = game.i18n.localize(value);
  return localized === value ? value : localized;
}

function getMethodLabel(method) {
  const model = getSpellcastingModel(method);
  const candidates = [
    model?.label,
    model?.name,
    model?.type?.label
  ];

  for (const candidate of candidates) {
    if (candidate) return localizeMaybe(candidate);
  }

  return String(method)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function getLevelLabel(level) {
  const value = CONFIG.DND5E?.spellLevels?.[level];
  if (value?.label) return localizeMaybe(value.label);
  return localizeMaybe(value) || `Level ${level}`;
}

function getCategoryLabel(actor, method, level, items) {
  const slotData = items.map(item => getSlotData(actor, item)).find(Boolean);
  if (slotData?.label) return localizeMaybe(slotData.label);

  const methodLabel = getMethodLabel(method);
  const levelLabel = getLevelLabel(level);
  return `${methodLabel} — ${levelLabel}`;
}

function getCategoryUses(actor, item) {
  return () => {
    const slotData = getSlotData(actor, item);
    if (!slotData) return { max: 0, value: 0 };

    const max = Number(slotData.max ?? slotData.value ?? 0);
    const value = Number(slotData.value ?? 0);
    return { ...slotData, max, value };
  };
}

function isCustomLeveledSpell(item) {
  if (item?.type !== "spell") return false;
  if (item.flags?.dnd5e?.cachedFor) return false;

  const level = Number(item.system?.level ?? 0);
  const method = item.system?.method;

  if (level <= 0 || !method || BUILTIN_METHODS.has(method)) return false;

  // Only claim methods that D&D5e knows how to cast or that expose a real slot pool on the actor.
  return !!getSpellcastingModel(method);
}

function getCustomSpellsForPanel(actor, activationTypes) {
  const preparedOnly = shouldShowPreparedOnly(actor);

  return actor.items.filter(item => {
    if (!isCustomLeveledSpell(item)) return false;
    if (!activationTypes.includes(getActivationType(item))) return false;
    if (preparedOnly && !(Number(item.system?.prepared ?? 0) > 0)) return false;

    // A configured custom spellcasting method should normally provide a slot pool.
    // If it does not, leave the spell alone rather than showing a misleading counter.
    return !!getSlotData(actor, item);
  });
}

function groupSpells(spells) {
  const groups = new Map();

  for (const item of spells) {
    const method = item.system.method;
    const level = Number(item.system.level ?? 0);
    const key = `${method}:${level}`;

    if (!groups.has(key)) groups.set(key, { method, level, items: [] });
    groups.get(key).items.push(item);
  }

  return Array.from(groups.values()).sort((a, b) => {
    const methodCompare = String(a.method).localeCompare(String(b.method));
    return methodCompare || a.level - b.level;
  });
}

function makeCompatClasses() {
  const ARGON = CONFIG.ARGON;
  if (!ARGON?.MAIN?.BUTTONS?.ItemButton || !ARGON?.MAIN?.BUTTONS?.ButtonPanelButton) {
    throw new Error("Argon CORE API is not available.");
  }

  class CompatSpellItemButton extends ARGON.MAIN.BUTTONS.ItemButton {
    constructor({ item }) {
      super({ item });
    }

    get hasTooltip() {
      return true;
    }

    async getTooltipData() {
      const item = this.item;
      if (!item?.system) return null;

      const descriptionSource = item.system.identified
        ? item.system.description?.value
        : (item.system.description?.unidentified ?? item.system.description?.value);

      const description = descriptionSource
        ? await foundry.applications.ux.TextEditor.implementation.enrichHTML(descriptionSource, {
            async: true,
            relativeTo: item
          })
        : "";

      const properties = [];
      const school = CONFIG.DND5E?.spellSchools?.[item.system.school];
      if (school) properties.push({ label: school?.label ?? school, secondary: true });

      if (item.labels?.duration) properties.push({ label: item.labels.duration, secondary: true });
      if (item.labels?.save) properties.push({ label: item.labels.save, secondary: true });

      for (const component of item.labels?.components?.all ?? []) {
        const label = component?.abbr ?? component?.label ?? component;
        if (label) properties.push({ label, secondary: true });
      }

      for (const damage of item.labels?.damages ?? []) {
        if (damage?.damageType) properties.unshift({ label: damage.damageType, primary: true });
      }

      const details = [];
      const target = item.labels?.target || "-";
      const range = item.labels?.range || "-";
      if (target || range) {
        details.push(
          { label: "enhancedcombathud-dnd5e.tooltip.target.name", value: target },
          { label: "enhancedcombathud-dnd5e.tooltip.range.name", value: range }
        );
      }

      if (item.labels?.toHit) {
        details.push({
          label: "enhancedcombathud-dnd5e.tooltip.toHit.name",
          value: item.labels.toHit
        });
      }

      if (item.labels?.damages?.length) {
        const damageText = item.labels.damages
          .map(d => [d?.formula, d?.damageType].filter(Boolean).join(" "))
          .filter(Boolean)
          .join("; " );
        if (damageText) {
          details.push({
            label: "enhancedcombathud-dnd5e.tooltip.damage.name",
            value: damageText
          });
        }
      }

      return {
        title: item.name,
        description,
        subtitle: [item.labels?.level, item.labels?.school].filter(Boolean).join(" "),
        details,
        properties,
        propertiesLabel: "enhancedcombathud-dnd5e.tooltip.properties.name",
        footerText: item.labels?.materials ?? ""
      };
    }

    get activity() {
      return getFirstActivity(this.item);
    }

    get ranges() {
      const activity = this.activity;
      const units = activity?.range?.units;
      const touchRange = units === "touch" ? canvas?.scene?.grid?.distance : null;
      return {
        normal: activity?.range?.value ?? touchRange,
        long: activity?.range?.long ?? null
      };
    }

    get targets() {
      const activity = this.activity;
      if (!activity) return 0;

      const validTargets = ["creature", "ally", "enemy"];
      const affects = activity.target?.affects ?? {};
      const targetType = affects.type;
      const actionType = activity.actionType;

      if (!activity.target?.template?.units && validTargets.includes(targetType)) return affects.count ?? 1;
      if (validTargets.includes(targetType) && affects.count) return affects.count;
      if (["mwak", "rwak", "msak", "rsak"].includes(actionType)) return affects.count || 1;
      return 0;
    }

    // The native D&D5e use workflow still handles dialogs, slot consumption,
    // Midi-QOL hooks, templates, effects, and chat cards.
    async _onLeftClick(event) {
      return this.item?.use?.({ event, legacy: false }, { event });
    }

    async _onRightClick() {
      return this.item?.sheet?.render(true);
    }
  }

  class CompatSpellButton extends ARGON.MAIN.BUTTONS.ButtonPanelButton {
    constructor({ actor, groups, color }) {
      super();
      this._actor = actor;
      this.groups = groups;
      this.color = color;
    }

    get actor() {
      return this._actor;
    }

    get colorScheme() {
      return this.color;
    }

    // Match the native Argon spell button identity for this action panel.
    get id() {
      return `spell-${this.color}`;
    }

    get label() {
      return "enhancedcombathud-dnd5e.hud.castspell.name";
    }

    get icon() {
      return "modules/enhancedcombathud/icons/spell-book.webp";
    }

    get hasContents() {
      return this.groups.some(group => group.items.length);
    }

    async _getPanel() {
      const categories = buildCompatCategories(this.actor, this.groups, ARGON, CompatSpellItemButton);
      return new ARGON.MAIN.BUTTON_PANELS.ACCORDION.AccordionPanel({
        id: this.id,
        accordionPanelCategories: categories
      });
    }
  }

  return { CompatSpellButton, CompatSpellItemButton };
}

function buildCompatSpellDescriptors(actor, groups, CompatSpellItemButton) {
  return groups.map(group => {
    const sample = group.items[0];
    return {
      label: getCategoryLabel(actor, group.method, group.level, group.items),
      buttons: group.items.map(item => new CompatSpellItemButton({ item })),
      uses: getCategoryUses(actor, sample),
      __argonApothecaryCompat: true
    };
  });
}

function buildCompatCategories(actor, groups, ARGON, CompatSpellItemButton) {
  return buildCompatSpellDescriptors(actor, groups, CompatSpellItemButton).map(({ label, buttons, uses }) =>
    new ARGON.MAIN.BUTTON_PANELS.ACCORDION.AccordionPanelCategory({ label, buttons, uses })
  );
}

function patchPanelClass(PanelClass, CompatSpellButton, CompatSpellItemButton) {
  if (!PanelClass?.prototype?._getButtons || PanelClass.prototype.__argonApothecaryCompatPatched) return;

  const originalGetButtons = PanelClass.prototype._getButtons;

  PanelClass.prototype._getButtons = async function (...args) {
    const buttons = await originalGetButtons.apply(this, args);
    const config = PANEL_CONFIG[this.label];
    if (!config || !this.actor) return buttons;

    const customSpells = getCustomSpellsForPanel(this.actor, config.activationTypes);
    if (!customSpells.length) return buttons;

    const grouped = groupSpells(customSpells);

    // If Argon already created its normal "Cast Spell" button (for example because
    // the actor has cantrips), merge the Apothecary categories directly into that
    // button. This keeps everything under the same spell-book menu and leaves the
    // native Argon categories and native spell buttons untouched.
    const nativeSpellButton = buttons.find(button =>
      button?.type === "spell" && Array.isArray(button?._spells)
    );

    if (nativeSpellButton) {
      const compatDescriptors = buildCompatSpellDescriptors(this.actor, grouped, CompatSpellItemButton);
      nativeSpellButton._spells.push(...compatDescriptors);
      return buttons;
    }

    // Some action-economy panels may contain only custom-method spells. In that
    // case Argon discards its empty native spell button, so provide a compatible
    // replacement with the exact same "Cast Spell" label/icon instead of creating
    // a separate "Apothecary Magic" top-level button.
    const compatButton = new CompatSpellButton({
      actor: this.actor,
      groups: grouped,
      color: config.color
    });

    if (compatButton.hasContents) buttons.push(compatButton);
    return buttons;
  };

  Object.defineProperty(PanelClass.prototype, "__argonApothecaryCompatPatched", {
    value: true,
    configurable: false,
    enumerable: false,
    writable: false
  });
}

function installPatch() {
  if (game?.system?.id && game.system.id !== "dnd5e") return;

  const CoreHud = CONFIG.ARGON?.CORE?.CoreHud;
  if (!CoreHud?.defineMainPanels) {
    warn("Argon CORE was not found; compatibility patch was not installed.");
    return;
  }

  if (CoreHud.__argonApothecaryCompatDefinePatched) return;

  const { CompatSpellButton, CompatSpellItemButton } = makeCompatClasses();
  const originalDefineMainPanels = CoreHud.defineMainPanels;

  CoreHud.defineMainPanels = function (panels) {
    for (const PanelClass of panels ?? []) patchPanelClass(PanelClass, CompatSpellButton, CompatSpellItemButton);
    return originalDefineMainPanels.call(this, panels);
  };

  Object.defineProperty(CoreHud, "__argonApothecaryCompatDefinePatched", {
    value: true,
    configurable: false,
    enumerable: false,
    writable: false
  });

  log("Compatibility patch installed. Custom leveled spellcasting methods will be merged into Argon's native Cast Spell menus.");
}

try {
  installPatch();
} catch (err) {
  console.error(`${MODULE_ID} | Failed to install compatibility patch.`, err);
}

Hooks.once("ready", () => {
  const core = game.modules.get("enhancedcombathud")?.active;
  const dnd5e = game.modules.get(ARGON_DND5E_ID)?.active;
  const scgd = game.modules.get("drakkenheim-scgd")?.active;

  if (!core || !dnd5e || !scgd) {
    warn("One or more expected modules are not active.", { core, dnd5e, scgd });
    return;
  }

  log("Ready.");
});
