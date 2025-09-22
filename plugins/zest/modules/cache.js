/*\
title: $:/plugins/midorum/zest/modules/cache.js
type: application/javascript
module-type: utils

Simple cache.

\*/
(function () {

  /*jslint node: true, browser: true */
  /*global $tw: false */
  "use strict";

  const zestFilterOperatorsCache = (function () {
    var operators;
    return {
      get: function (operator) {
        if (!operators) {
          operators = {};
          $tw.modules.applyMethods("zestfilteroperator", operators);
        }
        return operators[operator];
      }
    }
  })();

  exports.getZestFilterOperator = function (operator) {
    return zestFilterOperatorsCache.get(operator)
  }

})();