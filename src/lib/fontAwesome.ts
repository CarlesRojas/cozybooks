// Font Awesome injects its stylesheet into <head> on first render by default, which
// under SSR lands after the markup — icons flash at their natural size until it
// arrives. `src/style.css` imports the same stylesheet instead, so the injection is
// turned off here. Imported for its side effect from the root route, before any icon
// renders.

import { config } from "@fortawesome/fontawesome-svg-core";

config.autoAddCss = false;
