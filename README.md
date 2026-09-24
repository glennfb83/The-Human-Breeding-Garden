# The Human Breeding Garden

A self-contained static browser game about a strange social greenhouse. In this prototype, **breeding means cross-pollinating fictional plants**, not people: gardeners contribute plant gene samples, and the player combines them into hybrid fruit.

## Play

Open `index.html` directly, or serve the folder with any static web server. There is no build step, backend, account, or popup confirmation.

- **WASD / arrow keys** — explore the garden.
- **E / Space** — network with a nearby glowing gardener.
- **R** — cross-pollinate two collected plant genes.
- Click a contact in **Known signals** to follow their signal.

Meet gardeners to collect gene samples and spend sun seeds to increase trust. Once you have two different gene samples, press `R` in the breeding lab. Each successful cross produces a new hybrid fruit and consumes wild pollen.

## Included network

Big P, Max, Leif, GlennFB, Cling22, Benjamin Netanyahu, Charlie Kirk, IceMan, and FireMan each have a location, mood, trust level, plant gene, and unique signal in the garden.

## Files

- `index.html` — game shell, canvas, tutorial, contacts, inventory, lab, and log.
- `styles.css` — responsive paper/static web aesthetic.
- `main.js` — movement, canvas rendering, networking, inventory, tutorial, and botanical breeding.

The game intentionally keeps all feedback in the interface. Refreshing starts a fresh garden because persistence is not part of this foundation.
