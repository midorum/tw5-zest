/*\
title $:/plugins/midorum/zest/filteroperators/hit.js
type: application/javascript
module-type: zestfilteroperator

Getting into the list of correct statements

\*/

(function () {

	/*jslint node: true, browser: true */
	/*global $tw: false */
	"use strict";

	const utils = require("$:/plugins/midorum/zest/modules/utils.js").zestUtils;

	exports.hit = function (source, operator, options) {
		const wikiUtils = utils.getWikiUtils(options.wiki);
		const src = operator.operands[0];
		const srcTiddler = wikiUtils.withTiddler(src);
		if (!srcTiddler.exists()) {
			return ["Error: Tiddler not found: " + src];
		}
		const correctStatementsField = srcTiddler.getTiddlerField("correct-statements");
		if (!correctStatementsField) {
			return ["Error: Tiddler has no correct statements: " + src];
		}
		const correctStatements = utils.parseStringList(correctStatementsField, false);
		if (!correctStatements || correctStatements.length === 0) {
			return ["Error: Tiddler has no correct statements: " + src];
		}
		const hit = [];
		const miss = [];
		source(function (tiddler, title) {
			if (correctStatements.indexOf(title) >= 0) {
				hit.push(title);
			} else {
				miss.push(title);
			}
		});
		// console.log("hit", hit, "miss", miss);
		return miss.length > 0 || hit.length !== correctStatements.length ? ["miss"] : ["hit"];
	};

})();
