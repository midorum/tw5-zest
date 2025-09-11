/*\
title: $:/plugins/midorum/zest/modules/startup.js
type: application/javascript
module-type: startup

Adds listeners for zest messages.

\*/
(function () {

  /*jslint node: true, browser: true */
  /*global $tw: false */
  "use strict";

  const messageHandler = require("$:/plugins/midorum/zest/modules/message-handler.js");

  // Export name and synchronous status
  exports.name = "zest-startup";
  exports.after = ["startup"];
  exports.synchronous = true;

  exports.startup = function () {

    $tw.rootWidget.addEventListener("tm-zest-create-domain", function (event) {
      const widget = event.widget || $tw.rootWidget;
      const params = event.paramObject || {};
      messageHandler.createDomain(params, widget, $tw);
    });

    $tw.rootWidget.addEventListener("tm-zest-update-domain", function (event) {
      const widget = event.widget || $tw.rootWidget;
      const params = event.paramObject || {};
      messageHandler.updateDomain(params, widget, $tw);
    });

    $tw.rootWidget.addEventListener("tm-zest-delete-domain", function (event) {
      const widget = event.widget || $tw.rootWidget;
      const params = event.paramObject || {};
      messageHandler.deleteDomain(params, widget, $tw);
    });

    $tw.rootWidget.addEventListener("tm-zest-create-category", function (event) {
      const widget = event.widget || $tw.rootWidget;
      const params = event.paramObject || {};
      messageHandler.createCategory(params, widget, $tw);
    });

    $tw.rootWidget.addEventListener("tm-zest-update-category", function (event) {
      const widget = event.widget || $tw.rootWidget;
      const params = event.paramObject || {};
      messageHandler.updateCategory(params, widget, $tw);
    });

    $tw.rootWidget.addEventListener("tm-zest-attach-category", function (event) {
      const widget = event.widget || $tw.rootWidget;
      const params = event.paramObject || {};
      messageHandler.attachCategory(params, widget, $tw);
    });

    $tw.rootWidget.addEventListener("tm-zest-detach-category", function (event) {
      const widget = event.widget || $tw.rootWidget;
      const params = event.paramObject || {};
      messageHandler.detachCategory(params, widget, $tw);
    });

    $tw.rootWidget.addEventListener("tm-zest-delete-category", function (event) {
      const widget = event.widget || $tw.rootWidget;
      const params = event.paramObject || {};
      messageHandler.deleteCategory(params, widget, $tw);
    });

    $tw.rootWidget.addEventListener("tm-zest-create-thesis", function (event) {
      const widget = event.widget || $tw.rootWidget;
      const params = event.paramObject || {};
      messageHandler.createThesis(params, widget, $tw);
    });

    $tw.rootWidget.addEventListener("tm-zest-update-thesis", function (event) {
      const widget = event.widget || $tw.rootWidget;
      const params = event.paramObject || {};
      messageHandler.updateThesis(params, widget, $tw);
    });

    $tw.rootWidget.addEventListener("tm-zest-delete-thesis", function (event) {
      const widget = event.widget || $tw.rootWidget;
      const params = event.paramObject || {};
      messageHandler.deleteThesis(params, widget, $tw);
    });

  };

})();