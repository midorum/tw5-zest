/*\
title: $:/plugins/midorum/zest/modules/message-handler.js
type: application/javascript
module-type: zest-module

Handling zest messages.

\*/
(function () {

  /*jslint node: true, browser: true */
  /*global $tw: false */
  "use strict";

  const utils = require("$:/plugins/midorum/zest/modules/utils.js").zestUtils;

  function validateThesisStatements(correctStatements, incorrectStatements) {
    const result = {};
    if (!correctStatements && !incorrectStatements) {
      return result;
    }
    if (!correctStatements || !incorrectStatements) {
      throw new Error("Both thesis correct statements and incorrect statements must be provided together");
    }
    const csl = utils.parseStringList(correctStatements, false);
    const isl = utils.parseStringList(incorrectStatements, false);
    if (csl.length === 0 || isl.length === 0) {
      throw new Error("Both thesis correct statements and incorrect statements must be non-empty arrays");
    }
    result.correct = utils.stringifyList(csl);
    result.incorrect = utils.stringifyList(isl);
    return result;
  }

  /**
   * Create a new domain.
   * @param {Object} params - Parameters object.
   * @param {string} params.name - Domain name. (required)
   * @param {string} [params.description] - Domain description.
   * @throws Alerts if name is empty or already exists.
   */
  exports.createDomain = function (params, widget, env) {
    const context = {
      wikiUtils: utils.getWikiUtils(widget.wiki),
      env: env,
      logger: new $tw.utils.Logger("Zest:createDomain"),
      prefixes: $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/prefixes", []),
      tags: $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/tags", []),
    };
    const alertMsg = "%1 cannot be empty";
    const name = utils.trimToUndefined(params.name);
    if (!name) {
      context.logger.alert(utils.formatString(alertMsg, "name"));
      return;
    }
    const domainTag = context.tags.domain;
    const allDomains = context.wikiUtils.allTitlesWithTag(domainTag) || [];
    for (let t of allDomains) {
      const tiddler = context.wikiUtils.withTiddler(t);
      if (tiddler.getTiddlerField("name") === name) {
        context.logger.alert("Domain with this name already exists");
        return;
      }
    }
    const domainPrefix = context.prefixes.domain;
    const title = context.wikiUtils.generateNewInternalTitle(domainPrefix);
    const fields = {
      title: title,
      name: name,
      text: utils.trimToUndefined(params.description),
      tags: [domainTag]
    };
    context.wikiUtils.addTiddler(fields);
  };

  /**
   * Update an existing domain.
   * @param {Object} params - Parameters object.
   * @param {string} params.id - Domain tiddler id. (required)
   * @param {string} params.name - New domain name. (required)
   * @param {string} [params.description] - New description.
   * @throws Alerts if id, name are empty, or domain not found, or name already exists.
   */
  exports.updateDomain = function (params, widget, env) {
    const context = {
      wikiUtils: utils.getWikiUtils(widget.wiki),
      env: env,
      logger: new $tw.utils.Logger("Zest:updateDomain"),
      prefixes: $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/prefixes", []),
      tags: $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/tags", []),
    };
    const title = utils.trimToUndefined(params.id);
    if (!title) {
      context.logger.alert("Domain id is required");
      return;
    }
    const tiddler = context.wikiUtils.withTiddler(title);
    if (!tiddler.exists()) {
      context.logger.alert("Domain not found");
      return;
    }
    let newName = utils.trimToUndefined(params.name);
    if (!newName) {
      context.logger.alert(`Domain name cannot be empty`);
      return;
    }
    if (newName !== tiddler.getTiddlerField("name")) {
      const domainTag = context.tags.domain;
      const allDomains = context.wikiUtils.allTitlesWithTag(domainTag) || [];
      for (let t of allDomains) {
        if (t === title) continue;
        const other = context.wikiUtils.withTiddler(t);
        if (other.getTiddlerField("name") === newName) {
          context.logger.alert("Domain with this name already exists");
          return;
        }
      }
    }
    let newDescription = utils.trimToUndefined(params.description);
    const updateFields = {
      name: newName,
      text: newDescription
    };
    tiddler.doNotInvokeSequentiallyOnSameTiddler.updateTiddler(updateFields);
  };

  /**
   * Delete a domain if no categories are linked.
   * @param {Object} params - Parameters object.
   * @param {string} params.id - Domain tiddler id. (required)
   * @throws Alerts if id is empty, domain not found, or categories are linked.
   */
  exports.deleteDomain = function (params, widget, env) {
    const context = {
      wikiUtils: utils.getWikiUtils(widget.wiki),
      env: env,
      logger: new $tw.utils.Logger("Zest:deleteDomain"),
      tags: $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/tags", []),
    };
    const title = utils.trimToUndefined(params.id);
    if (!title) {
      context.logger.alert("Domain id is required");
      return;
    }
    const tiddler = context.wikiUtils.withTiddler(title);
    if (!tiddler.exists()) {
      context.logger.alert("Domain not found");
      return;
    }
    const categoryTag = context.tags.category;
    const linkedCategories = context.wikiUtils.filterTiddlers(`[tag[${categoryTag}]tag[${title}]]`);
    if (linkedCategories && linkedCategories.length > 0) {
      context.logger.alert("Cannot delete domain: categories are still linked to this domain");
      return;
    }
    tiddler.doNotInvokeSequentiallyOnSameTiddler.deleteTiddler();
  };

  /**
   * Create a new category linked to a domain and a thesis linked to the category.
   * @param {Object} params - Parameters object.
   * @param {string} params.name - Category name. (required)
   * @param {string} params.domainId - Domain tiddler id. (required)
   * @param {string} params.thesisText - Thesis text. (required)
   * @param {string} [params.thesisNote] - Thesis note.
   * @param {Array} [params.thesisCorrectStatements] - Optional array of correct statements for thesis.
   * @param {Array} [params.thesisIncorrectStatements] - Optional array of incorrect statements for thesis.
   * @throws Alerts if required fields are missing or domain not found, or statement validation fails.
   */
  exports.createCategory = function (params, widget, env) {
    const context = {
      wikiUtils: utils.getWikiUtils(widget.wiki),
      env: env,
      logger: new $tw.utils.Logger("Zest:createCategory"),
      prefixes: $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/prefixes", []),
      tags: $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/tags", []),
    };
    const alertMsg = "%1 cannot be empty";
    const name = utils.trimToUndefined(params.name);
    const domainId = utils.trimToUndefined(params.domainId);
    const thesisText = utils.trimToUndefined(params.thesisText);
    const thesisNote = utils.trimToUndefined(params.thesisNote);
    if (!name) {
      context.logger.alert(utils.formatString(alertMsg, "category name"));
      return;
    }
    if (!domainId) {
      context.logger.alert(utils.formatString(alertMsg, "domain id"));
      return;
    }
    if (!thesisText) {
      context.logger.alert(utils.formatString(alertMsg, "thesis text"));
      return;
    }
    const thesisStatements = (() => {
      try {
        return validateThesisStatements(
          utils.trimToUndefined(params.thesisCorrectStatements),
          utils.trimToUndefined(params.thesisIncorrectStatements));
      } catch (e) {
        context.logger.alert(e.message);
        return undefined;
      }
    })();
    if (!thesisStatements) {
      return;
    }
    // Check domain exists
    const domainTiddler = context.wikiUtils.withTiddler(domainId);
    if (!domainTiddler.exists()) {
      context.logger.alert("Domain not found");
      return;
    }
    // Create category
    const categoryPrefix = context.prefixes.category;
    const categoryTag = context.tags.category;
    const categoryTitle = context.wikiUtils.generateNewInternalTitle(categoryPrefix);
    const categoryFields = {
      title: categoryTitle,
      text: name,
      tags: [categoryTag, domainId]
    };
    context.wikiUtils.addTiddler(categoryFields);
    // Create thesis
    const thesisPrefix = context.prefixes.thesis;
    const thesisTag = context.tags.thesis;
    const thesisTitle = context.wikiUtils.generateNewInternalTitle(thesisPrefix);
    const thesisFields = {
      title: thesisTitle,
      text: thesisText,
      note: thesisNote,
      tags: [thesisTag, categoryTitle, "$:/srs/tags/scheduledForward"]
    };
    if (thesisStatements.correct && thesisStatements.incorrect) {
      thesisFields["correct-statements"] = thesisStatements.correct;
      thesisFields["incorrect-statements"] = thesisStatements.incorrect;
    }
    context.wikiUtils.addTiddler(thesisFields);
  };

  /**
   * Update the category name.
   * @param {Object} params - Parameters object.
   * @param {string} params.id - Category tiddler id. (required)
   * @param {string} params.name - New category name. (required)
   * @throws Alerts if id, name are empty or category not found.
   */
  exports.updateCategory = function (params, widget, env) {
    const context = {
      wikiUtils: utils.getWikiUtils(widget.wiki),
      env: env,
      logger: new $tw.utils.Logger("Zest:updateCategory"),
      tags: $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/tags", []),
    };
    const title = utils.trimToUndefined(params.id);
    if (!title) {
      context.logger.alert("Category id is required");
      return;
    }
    const tiddler = context.wikiUtils.withTiddler(title);
    if (!tiddler.exists()) {
      context.logger.alert("Category not found");
      return;
    }
    let newName = utils.trimToUndefined(params.name);
    if (!newName) {
      context.logger.alert("Category name cannot be empty");
      return;
    }
    const updateFields = {
      text: newName
    };
    tiddler.doNotInvokeSequentiallyOnSameTiddler.updateTiddler(updateFields);
  };

  /**
   * Attach a category to an existing domain.
   * @param {Object} params - Parameters object.
   * @param {string} params.categoryId - Category tiddler id. (required)
   * @param {string} params.domainId - Domain tiddler id. (required)
   * @throws Alerts if ids are missing or tiddlers not found.
   */
  exports.attachCategory = function (params, widget, env) {
    const context = {
      wikiUtils: utils.getWikiUtils(widget.wiki),
      env: env,
      logger: new $tw.utils.Logger("Zest:attachCategory"),
      tags: $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/tags", []),
    };
    const categoryId = utils.trimToUndefined(params.categoryId);
    const domainId = utils.trimToUndefined(params.domainId);
    if (!categoryId) {
      context.logger.alert("Category id is required");
      return;
    }
    if (!domainId) {
      context.logger.alert("Domain id is required");
      return;
    }
    const categoryTiddler = context.wikiUtils.withTiddler(categoryId);
    if (!categoryTiddler.exists()) {
      context.logger.alert("Category not found");
      return;
    }
    const domainTiddler = context.wikiUtils.withTiddler(domainId);
    if (!domainTiddler.exists()) {
      context.logger.alert("Domain not found");
      return;
    }
    // Add domainId to category's tags if not already present
    const tags = categoryTiddler.getTiddlerTagsShallowCopy();
    if (!tags.includes(domainId)) {
      categoryTiddler.doNotInvokeSequentiallyOnSameTiddler.updateTiddler({ tags: tags.concat([domainId]) });
    }
  };

  /**
   * Detach a category from a domain, only if at least one domain remains linked.
   * @param {Object} params - Parameters object.
   * @param {string} params.categoryId - Category tiddler id. (required)
   * @param {string} params.domainId - Domain tiddler id. (required)
   * @throws Alerts if ids are missing, tiddlers not found, or only one domain is linked.
   */
  exports.detachCategory = function (params, widget, env) {
    const context = {
      wikiUtils: utils.getWikiUtils(widget.wiki),
      env: env,
      logger: new $tw.utils.Logger("Zest:detachCategory"),
      tags: $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/tags", []),
      prefixes: $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/prefixes", []),
    };
    const categoryId = utils.trimToUndefined(params.categoryId);
    const domainId = utils.trimToUndefined(params.domainId);
    if (!categoryId) {
      context.logger.alert("Category id is required");
      return;
    }
    if (!domainId) {
      context.logger.alert("Domain id is required");
      return;
    }
    const categoryTiddler = context.wikiUtils.withTiddler(categoryId);
    if (!categoryTiddler.exists()) {
      context.logger.alert("Category not found");
      return;
    }
    const domainTiddler = context.wikiUtils.withTiddler(domainId);
    if (!domainTiddler.exists()) {
      context.logger.alert("Domain not found");
      return;
    }
    // Remove domainId from category's tags only if more than one domain is linked
    const tags = categoryTiddler.getTiddlerTagsShallowCopy();
    // Count how many tags are domain ids (exclude category tag itself)
    const domainPrefix = context.prefixes.domain;
    const otherLinkedDomains = tags.filter(tag => tag !== domainId && tag.startsWith(domainPrefix));
    if (otherLinkedDomains.length < 1) {
      context.logger.alert("Cannot detach: category must be linked to at least one domain");
      return;
    }
    categoryTiddler.doNotInvokeSequentiallyOnSameTiddler.deleteTagsToTiddler([domainId]);
  };

  /**
   * Delete a category and all related theses.
   * @param {Object} params - Parameters object.
   * @param {string} params.id - Category tiddler id. (required)
   * @throws Alerts if id is missing or category not found.
   */
  exports.deleteCategory = function (params, widget, env) {
    const context = {
      wikiUtils: utils.getWikiUtils(widget.wiki),
      env: env,
      logger: new $tw.utils.Logger("Zest:deleteCategory"),
      tags: $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/tags", []),
    };
    const categoryId = utils.trimToUndefined(params.id);
    if (!categoryId) {
      context.logger.alert("Category id is required");
      return;
    }
    const categoryTiddler = context.wikiUtils.withTiddler(categoryId);
    if (!categoryTiddler.exists()) {
      context.logger.alert("Category not found");
      return;
    }
    // Find and delete all theses linked to this category
    const thesisTag = context.tags.thesis;
    const linkedTheses = context.wikiUtils.filterTiddlers(`[tag[${thesisTag}]tag[${categoryId}]]`);
    for (let thesisTitle of linkedTheses) {
      const thesisTiddler = context.wikiUtils.withTiddler(thesisTitle);
      if (thesisTiddler.exists()) {
        thesisTiddler.doNotInvokeSequentiallyOnSameTiddler.deleteTiddler();
      }
    }
    // Delete the category itself
    categoryTiddler.doNotInvokeSequentiallyOnSameTiddler.deleteTiddler();
  };

  /**
   * Create a new thesis for an existing category.
   * @param {Object} params - Parameters object.
   * @param {string} params.categoryId - Category tiddler id. (required)
   * @param {string} params.text - Thesis text. (required)
   * @param {string} [params.note] - Thesis note.
   * @param {Array} [params.correctStatements] - Optional array of correct statements for thesis.
   * @param {Array} [params.incorrectStatements] - Optional array of incorrect statements for thesis.
   * @throws Alerts if required fields are missing or category not found, or statement validation fails.
   */
  exports.createThesis = function (params, widget, env) {
    const context = {
      wikiUtils: utils.getWikiUtils(widget.wiki),
      env: env,
      logger: new $tw.utils.Logger("Zest:createThesis"),
      prefixes: $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/prefixes", []),
      tags: $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/tags", []),
    };
    const categoryId = utils.trimToUndefined(params.categoryId);
    const thesisText = utils.trimToUndefined(params.text);
    const thesisNote = utils.trimToUndefined(params.note);
    if (!categoryId) {
      context.logger.alert("Category id is required");
      return;
    }
    if (!thesisText) {
      context.logger.alert("Thesis text cannot be empty");
      return;
    }
    const thesisStatements = (() => {
      try {
        return validateThesisStatements(
          utils.trimToUndefined(params.correctStatements),
          utils.trimToUndefined(params.incorrectStatements));
      } catch (e) {
        context.logger.alert(e.message);
        return undefined;
      }
    })();
    if (thesisStatements === undefined) {
      return;
    }
    const categoryTiddler = context.wikiUtils.withTiddler(categoryId);
    if (!categoryTiddler.exists()) {
      context.logger.alert("Category not found");
      return;
    }
    const thesisPrefix = context.prefixes.thesis;
    const thesisTag = context.tags.thesis;
    const thesisTitle = context.wikiUtils.generateNewInternalTitle(thesisPrefix);
    const thesisFields = {
      title: thesisTitle,
      text: thesisText,
      note: thesisNote,
      tags: [thesisTag, categoryId, "$:/srs/tags/scheduledForward"]
    };
    if (thesisStatements.correct && thesisStatements.incorrect) {
      thesisFields["correct-statements"] = thesisStatements.correct;
      thesisFields["incorrect-statements"] = thesisStatements.incorrect;
    }
    context.wikiUtils.addTiddler(thesisFields);
  };

  /**
   * Update thesis text and note.
   * @param {Object} params - Parameters object.
   * @param {string} params.id - Thesis tiddler id. (required)
   * @param {string} params.text - New thesis text. (required)
   * @param {string} [params.note] - New thesis note.
   * @param {Array} [params.correctStatements] - Optional array of correct statements for thesis.
   * @param {Array} [params.incorrectStatements] - Optional array of incorrect statements for thesis.
   * @throws Alerts if id is missing, thesis not found, or text is empty, or statement validation fails.
   */
  exports.updateThesis = function (params, widget, env) {
    const context = {
      wikiUtils: utils.getWikiUtils(widget.wiki),
      env: env,
      logger: new $tw.utils.Logger("Zest:updateThesis"),
      tags: $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/tags", []),
    };
    const thesisId = utils.trimToUndefined(params.id);
    if (!thesisId) {
      context.logger.alert("Thesis id is required");
      return;
    }
    const thesisTiddler = context.wikiUtils.withTiddler(thesisId);
    if (!thesisTiddler.exists()) {
      context.logger.alert("Thesis not found");
      return;
    }
    const newText = utils.trimToUndefined(params.text);
    const newNote = utils.trimToUndefined(params.note);
    if (!newText) {
      context.logger.alert("Thesis text cannot be empty");
      return;
    }
    const thesisStatements = (() => {
      try {
        return validateThesisStatements(
          utils.trimToUndefined(params.correctStatements),
          utils.trimToUndefined(params.incorrectStatements));
      } catch (e) {
        context.logger.alert(e.message);
        return undefined;
      }
    })();
    if (thesisStatements === undefined) {
      return;
    }
    const updateFields = {};
    updateFields.text = newText;
    updateFields.note = newNote;
    if (!thesisStatements.correct && !thesisStatements.incorrect) {
      // If both are undefined, remove both fields
      updateFields["correct-statements"] = undefined;
      updateFields["incorrect-statements"] = undefined;
    } else if (thesisStatements.correct && thesisStatements.incorrect) {
      updateFields["correct-statements"] = thesisStatements.correct;
      updateFields["incorrect-statements"] = thesisStatements.incorrect;
    } else {
      context.logger.alert("Internal error: thesis statement validation failed");
      return;
    }
    thesisTiddler.doNotInvokeSequentiallyOnSameTiddler.updateTiddler(updateFields);
  };

  /**
   * Delete a thesis if it is not the last for the category.
   * @param {Object} params - Parameters object.
   * @param {string} params.id - Thesis tiddler id. (required)
   * @throws Alerts if id is missing, thesis not found, related category not found, or it is the last thesis for the category.
   */
  exports.deleteThesis = function (params, widget, env) {
    const context = {
      wikiUtils: utils.getWikiUtils(widget.wiki),
      env: env,
      logger: new $tw.utils.Logger("Zest:deleteThesis"),
      tags: $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/tags", []),
      prefixes: $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/prefixes", []),
    };
    const thesisId = utils.trimToUndefined(params.id);
    if (!thesisId) {
      context.logger.alert("Thesis id is required");
      return;
    }
    const thesisTiddler = context.wikiUtils.withTiddler(thesisId);
    if (!thesisTiddler.exists()) {
      context.logger.alert("Thesis not found");
      return;
    }
    const tags = thesisTiddler.getTiddlerTagsShallowCopy();
    const thesisTag = context.tags.thesis;
    const categoryId = tags.find(tag => tag.startsWith(context.prefixes.category));
    if (!categoryId) {
      context.logger.alert("Related category not found");
      return;
    }
    const linkedTheses = context.wikiUtils.filterTiddlers(`[tag[${thesisTag}]tag[${categoryId}]]`);
    if (linkedTheses.length <= 1) {
      context.logger.alert("Cannot delete the last thesis for the category");
      return;
    }
    thesisTiddler.doNotInvokeSequentiallyOnSameTiddler.deleteTiddler();
  };

})();
