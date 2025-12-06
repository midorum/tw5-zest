/*\
title: $:/plugins/midorum/zest/macros/layouts.js
type: application/javascript
module-type: macro
\*/
(function () {
  "use strict";

  exports.name = "zest-l";
  exports.params = [
    { name: "name" }
  ];
  exports.run = function (name) {
    if (!name) return "Error: The 'name' attribute should be defined";
    return "$:/plugins/midorum/zest/templates/" + name;
  };

})();