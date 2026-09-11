# Changelog

All notable changes to **Argon Apothecary Compatibility** are documented here.

The project follows [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-09-07

### Changed

- Merged custom-method leveled spells into Argon's normal **Cast Spell** menu instead of displaying a separate **Apothecary Magic** button.
- Kept custom spell levels connected to their own slot counters inside the Cast Spell accordion.
- Added a normal Cast Spell button when an action panel contains only custom-method spells and Argon would otherwise omit it.

### Retained

- Native-style spell tooltips introduced in 1.0.1.
- Standard D&D5e item-use workflow for casting, slot consumption, effects, templates, chat cards, and Midi-QOL hooks.

## 1.0.1 - 2026-09-07

### Added

- Native-style Argon hover tooltips for custom-method spells.
- Tooltip details for spell descriptions and, when available, level, school, range, target, damage, components, and material components.

## 1.0.0 - 2026-09-07

### Added

- Initial compatibility support for custom D&D5e spellcasting methods.
- Support for the Apothecary spellcasting method from *Sebastian Crowe's Guide to Drakkenheim*.
- Correct custom slot-pool detection through D&D5e's configured spellcasting model.
- Action, Bonus Action, Reaction, and Special panel placement based on each spell's activation type.
- Argon's per-actor Prepared Spells filtering.
- A separate **Apothecary Magic** spell-book button as the initial, low-impact integration approach.

[1.1.0]: https://github.com/fitsou/argon-apothecary-mod/releases/tag/v1.1.0
