/*\
title $:/plugins/midorum/zest/filteroperators/shuffle.js
type: application/javascript
module-type: zestfilteroperator

Shuffle input tiddlers

\*/

(function () {

	/*jslint node: true, browser: true */
	/*global $tw: false */
	"use strict";

	exports.shuffle = function (source, operator, options) {
		const randomOperand = operator.operands[0];
		const results = [];
		source(function (tiddler, title) {
			results.push(title);
		});
		let rand;
		if (randomOperand !== undefined) {
			// Simple seeded random generator (Mulberry32)
			let seed = Math.floor(Number(randomOperand) * 1e9) || 1;
			rand = function () {
				seed |= 0; seed = seed + 0x6D2B79F5 | 0;
				let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
				t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
				return ((t ^ t >>> 14) >>> 0) / 4294967296;
			};
		} else {
			rand = Math.random;
		}
		// Fisher-Yates shuffle
		for (let i = results.length - 1; i > 0; i--) {
			const j = Math.floor(rand() * (i + 1));
			[results[i], results[j]] = [results[j], results[i]];
		}
		return results;
	};

})();
