/**
 * Helpers for formatting game text.
 */

import { add as addInsert } from "chapbook/src/runtime/template/inserts";

addInsert({
	match: /capitalize/i,
	render(target, options) {
		if (typeof target === "string") {
			return target.charAt(0).toUpperCase() + target.substring(1, target.length);
		} else {
			return "";
		}
	}
})


// Follows the rough spec from https://cldr.unicode.org/index/cldr-spec/plural-rules
addInsert({
	match: /match_plural/i,
	render(target, options) {
		if (!("other" in options)) {
			return "Error: expected \"other\" to be set in match_plural.";
		}
		switch (target) {
			case "one":
				if ("one" in options){
					return options["one"];
				}
				break;
			case "two":
				if ("two" in options) {
					return options["two"];
				}
				break;
			case "few":
				if ("few" in options) {
					return options["few"];
				}
				break;
			case "many":
				if ("many" in options) {
					return options["many"];
				}
				break;
		}
		return options["other"];
	}
})