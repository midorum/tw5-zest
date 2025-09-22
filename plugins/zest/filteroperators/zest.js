/*\
title: $:/plugins/midorum/zest/filteroperators/zest.js
type: application/javascript
module-type: filteroperator

A namespace for Zest filters.

\*/

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

const cache = require("$:/plugins/midorum/zest/modules/cache.js");

exports.zest = function (source, operator, options) {
	const suffixOperator = operator.suffixes[0];
	var zestFilterOperator = cache.getZestFilterOperator(suffixOperator);
	if (!zestFilterOperator) {
		return ["Error: Operator not found: " + suffixOperator];
	}
	return zestFilterOperator(source, operator, options);
};