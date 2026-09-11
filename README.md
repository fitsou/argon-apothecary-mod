# Argon Apothecary Compatibility

[![Latest Release](https://img.shields.io/github/v/release/fitsou/argon-apothecary-mod?display_name=tag&sort=semver&label=Latest%20release)](https://github.com/fitsou/argon-apothecary-mod/releases/latest)
![Foundry VTT](https://img.shields.io/badge/Foundry_VTT-v14-orange)
![D&D5e](https://img.shields.io/badge/D%26D5e-5.3.0%2B-red)
[![License](https://img.shields.io/github/license/fitsou/argon-apothecary-mod)](LICENSE)

A small compatibility module that brings custom D&D5e spellcasting methods into Argon Combat HUD's normal **Cast Spell** menus.

Its main target is the **Apothecary** class from *Sebastian Crowe's Guide to Drakkenheim*, but the patch is intentionally method-based rather than hard-coded to a list of Apothecary spells. If D&D5e knows about a custom spellcasting method and the actor has a real slot pool for it, Argon can display it.

## Why this exists

This started with a very ordinary problem in our Drakkenheim game: the Apothecary's spells were present on the character sheet and worked normally, but once combat started Argon acted as if the leveled spells did not exist.

The cause was not the spells themselves. Argon grouped the standard D&D5e spellcasting methods, while the Apothecary used its own method and slot pool. The first version of this module simply gave those spells a place in the HUD. Later versions added the missing hover information and finally folded everything into Argon's familiar **Cast Spell** menu.

The aim is simple: make custom spellcasting feel native without editing Argon, D&D5e, or the Drakkenheim module.

## What it does

- Detects custom D&D5e spellcasting methods dynamically.
- Places leveled custom-method spells in the correct Action, Bonus Action, Reaction, or Special panel.
- Merges them into Argon's normal **Cast Spell** accordion instead of adding a second spell button.
- Keeps each custom spell level connected to its correct slot pool and counter.
- Respects Argon's per-actor **Prepared Spells** setting.
- Adds native-style hover tooltips with the spell description and available details such as level, school, range, target, damage, components, and materials.
- Uses the normal D&D5e item-use workflow, leaving casting dialogs, slot consumption, templates, effects, chat cards, and Midi-QOL hooks to the systems that already handle them.

## What it does not do

- It does not add or copy any spells, classes, artwork, or book content.
- It does not modify actor data.
- It does not replace or edit files belonging to Argon, D&D5e, or *Sebastian Crowe's Guide to Drakkenheim*.
- It does not change cantrips, because Argon already handles them correctly.

Disable or remove the module and the patch is gone.

## Compatibility

| Package | Supported version |
| --- | --- |
| Foundry Virtual Tabletop | 14 |
| D&D5e system | 5.3.0 or newer |
| Argon - Combat HUD (CORE) | 5.0.0 or newer |
| Argon - Combat HUD (DND5E) | 5.2.0 or newer |
| Sebastian Crowe's Guide to Drakkenheim | Required |

The versions above reflect the setup the module was built and tested against. Compatibility with later releases is not guaranteed until it has been tested.

## Installation

### Install from a manifest URL

In Foundry's **Add-on Modules** screen, choose **Install Module** and paste this URL into **Manifest URL**:

```text
https://github.com/fitsou/argon-apothecary-mod/releases/latest/download/module.json
```

### Manual installation

1. Download `argon-apothecary-compat.zip` from the [latest release](https://github.com/fitsou/argon-apothecary-mod/releases/latest).
2. Extract the `argon-apothecary-compat` folder into Foundry's `Data/modules/` directory.
3. Restart Foundry VTT.
4. Open your world and enable **Argon Apothecary Compatibility** under **Manage Modules**.
5. Reload the world when prompted.

There are no settings to configure. Select an actor with custom-method leveled spells and open Argon's regular **Cast Spell** menu.

## Troubleshooting

If the spells still do not appear:

1. Confirm that Argon CORE, Argon DND5E, and Sebastian Crowe's Guide are all enabled.
2. Check Argon's **Prepared Spells** option for the affected actor. Unprepared spells may be hidden depending on that setting.
3. Confirm that the actor has a valid slot pool for the custom spellcasting method.
4. Reload the world after enabling or updating the module.
5. Open the browser console with `F12` and look for messages beginning with `argon-apothecary-compat |`.

If the problem persists, please [open an issue](https://github.com/fitsou/argon-apothecary-mod/issues) and include your Foundry, D&D5e, Argon CORE, Argon DND5E, and Drakkenheim module versions.

## Version history

See [CHANGELOG.md](CHANGELOG.md) for the full history.

## Credits and disclaimer

This is an independent, unofficial community compatibility module. It is not affiliated with or endorsed by Foundry Gaming, the Dungeon Dudes, Ghostfire Gaming, or the Argon developers.

Foundry Virtual Tabletop, Dungeons of Drakkenheim, Sebastian Crowe's Guide to Drakkenheim, Argon Combat HUD, and all related names remain the property of their respective owners. This repository contains only the compatibility code and no proprietary game content.

## License

The code in this repository is available under the [MIT License](LICENSE).
