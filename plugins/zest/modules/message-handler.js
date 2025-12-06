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
    if (!correctStatements && !incorrectStatements) {
      return {};
    }
    if (!correctStatements || !incorrectStatements) {
      return {
        error: "Both thesis correct statements and incorrect statements must be provided together"
      };
    }
    const csl = utils.parseStringList(correctStatements, false);
    const isl = utils.parseStringList(incorrectStatements, false);
    if (csl.length === 0 || isl.length === 0) {
      return {
        error: "Both thesis correct statements and incorrect statements must be non-empty arrays"
      };
    }
    return {
      correct: utils.stringifyList(csl),
      incorrect: utils.stringifyList(isl)
    };
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
   * @param {string} [params.description] - Category description. (optional)
   * @param {string} [params.thesisText] - Thesis text. (optional)
   * @param {string} [params.thesisNote] - Thesis note. (optional)
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
    const description = utils.trimToUndefined(params.description);
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
    const thesisStatements = validateThesisStatements(
      utils.trimToUndefined(params.thesisCorrectStatements),
      utils.trimToUndefined(params.thesisIncorrectStatements));
    if (thesisStatements.error) {
      context.logger.alert(thesisStatements.error);
      return;
    }
    if ((thesisNote || thesisStatements.correct || thesisStatements.incorrect) && !thesisText) {
      context.logger.alert(utils.formatString(alertMsg, "thesis text"));
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
      name: name,
      text: description,
      tags: [categoryTag, domainId]
    };
    context.wikiUtils.addTiddler(categoryFields);
    // Create thesis
    if (!thesisText) {
      return;
    }
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
   * @param {string} [ params.description ] - New category description. (optional)
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
    let newDescription = utils.trimToUndefined(params.description);
    const updateFields = {
      name: newName,
      text: newDescription
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
   * Delete a category and all theses that are linked only to this category. Detach other linked theses from this category.
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
      prefixes: $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/prefixes", []),
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
    // Find theses that reference this category. For each thesis:
    // - if it is linked to more than one category, only detach this category
    // - if it is linked exclusively to this category, delete the thesis
    const thesisTag = context.tags.thesis;
    const linkedTheses = context.wikiUtils.filterTiddlers(`[tag[${thesisTag}]tag[${categoryId}]]`);
    const categoryPrefix = context.prefixes.category;
    for (let thesisTitle of linkedTheses) {
      const thesisTiddler = context.wikiUtils.withTiddler(thesisTitle);
      if (!thesisTiddler.exists()) {
        continue;
      }
      const thesisTags = thesisTiddler.getTiddlerTagsShallowCopy();
      // Count how many category tags are present on the thesis
      const linkedCategoryTags = thesisTags.filter(tag => tag.startsWith(categoryPrefix));
      if (linkedCategoryTags.length > 1) {
        // More than one category linked: remove only the deleted category from tags
        thesisTiddler.doNotInvokeSequentiallyOnSameTiddler.deleteTagsToTiddler([categoryId]);
      } else {
        // Only linked to this category: delete the thesis
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
    const thesisStatements = validateThesisStatements(
      utils.trimToUndefined(params.correctStatements),
      utils.trimToUndefined(params.incorrectStatements));
    if (thesisStatements.error) {
      context.logger.alert(thesisStatements.error);
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
    const thesisStatements = validateThesisStatements(
      utils.trimToUndefined(params.correctStatements),
      utils.trimToUndefined(params.incorrectStatements));
    if (thesisStatements.error) {
      context.logger.alert(thesisStatements.error);
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
   * Attach a thesis to an existing category.
   * @param {Object} params - Parameters object.
   * @param {string} params.thesisId - Thesis tiddler id. (required)
   * @param {string} params.categoryId - Category tiddler id. (required)
   * @throws Alerts if ids are missing, tiddlers not found, or thesis already linked to category.
   */
  exports.attachThesis = function (params, widget, env) {
    const context = {
      wikiUtils: utils.getWikiUtils(widget.wiki),
      env: env,
      logger: new $tw.utils.Logger("Zest:attachThesis"),
      tags: $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/tags", []),
    };
    const thesisId = utils.trimToUndefined(params.thesisId);
    const categoryId = utils.trimToUndefined(params.categoryId);
    if (!thesisId) {
      context.logger.alert("Thesis id is required");
      return;
    }
    if (!categoryId) {
      context.logger.alert("Category id is required");
      return;
    }
    const thesisTiddler = context.wikiUtils.withTiddler(thesisId);
    if (!thesisTiddler.exists()) {
      context.logger.alert("Thesis not found");
      return;
    }
    const categoryTiddler = context.wikiUtils.withTiddler(categoryId);
    if (!categoryTiddler.exists()) {
      context.logger.alert("Category not found");
      return;
    }
    const tags = thesisTiddler.getTiddlerTagsShallowCopy();
    if (!tags.includes(categoryId)) {
      thesisTiddler.doNotInvokeSequentiallyOnSameTiddler.updateTiddler({ tags: tags.concat([categoryId]) });
    }
  }

  /**
   * Detach a thesis from an existing category.
   * @param {Object} params - Parameters object.
   * @param {string} params.thesisId - Thesis tiddler id. (required)
   * @param {string} params.categoryId - Category tiddler id. (required)
   * @throws Alerts if ids are missing, tiddlers not found, thesis not linked to category, or detaching would leave the thesis without any categories.
   */
  exports.detachThesis = function (params, widget, env) {
    const context = {
      wikiUtils: utils.getWikiUtils(widget.wiki),
      env: env,
      logger: new $tw.utils.Logger("Zest:detachThesis"),
      tags: $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/tags", []),
      prefixes: $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/prefixes", []),
    };
    const thesisId = utils.trimToUndefined(params.thesisId);
    const categoryId = utils.trimToUndefined(params.categoryId);
    if (!thesisId) {
      context.logger.alert("Thesis id is required");
      return;
    }
    if (!categoryId) {
      context.logger.alert("Category id is required");
      return;
    }
    const thesisTiddler = context.wikiUtils.withTiddler(thesisId);
    if (!thesisTiddler.exists()) {
      context.logger.alert("Thesis not found");
      return;
    }
    const categoryTiddler = context.wikiUtils.withTiddler(categoryId);
    if (!categoryTiddler.exists()) {
      context.logger.alert("Category not found");
      return;
    }
    const tags = thesisTiddler.getTiddlerTagsShallowCopy();
    if (!tags.includes(categoryId)) {
      context.logger.alert("Thesis is not linked to this category");
      return;
    }
    const categoryPrefix = context.prefixes.category;
    const otherLinkedCategories = tags.filter(tag => tag != categoryId && tag.startsWith(categoryPrefix));
    if (otherLinkedCategories.length < 1) {
      context.logger.alert("Cannot detach: thesis must be linked to at least one category");
      return;
    }
    thesisTiddler.doNotInvokeSequentiallyOnSameTiddler.deleteTagsToTiddler([categoryId]);
  }

  /**
   * Delete a thesis.
   * @param {Object} params - Parameters object.
   * @param {string} params.id - Thesis tiddler id. (required)
   * @throws Alerts if id is missing, or thesis not found.
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
    thesisTiddler.doNotInvokeSequentiallyOnSameTiddler.deleteTiddler();
  };

  exports.migrate1 = function (params, widget, env) {
    const context = {
      wikiUtils: utils.getWikiUtils(widget.wiki),
      env: env,
      logger: new $tw.utils.Logger("Zest:migrate1"),
      tags: $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/tags", []),
      prefixes: $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/prefixes", []),
    };
    const categoryTag = context.tags.category;
    const categories = context.wikiUtils.allTitlesWithTag(categoryTag) || [];
    const migrationTime = Date.now();
    const migrated = [];
    const skipped = [];
    for (let title of categories) {
      const tiddler = context.wikiUtils.withTiddler(title);
      if (!tiddler.exists()) {
        skipped.push({ title: title, reason: "not found" });
        continue;
      }
      const alreadyMigrated = tiddler.getTiddlerField("zest-migrated-1");
      if (alreadyMigrated) {
        skipped.push({ title: title, reason: "already migrated" });
        continue;
      }
      const currentName = tiddler.getTiddlerField("name");
      if (currentName) {
        // name already present, but still mark as skipped (no-op)
        skipped.push({ title: title, reason: "name present" });
        continue;
      }
      const text = tiddler.getTiddlerField("text");
      const trimmed = utils.trimToUndefined(text);
      if (!trimmed) {
        skipped.push({ title: title, reason: "empty text" });
        continue;
      }
      // Perform migration: set name, clear text, mark with migration timestamp
      tiddler.doNotInvokeSequentiallyOnSameTiddler.updateTiddler({ name: trimmed, text: undefined, "zest-migrated-1": String(migrationTime) });
      migrated.push(title);
    }
    // Write migration summary to a log tiddler
    const logTitle = context.prefixes.log + "migrate1_" + migrationTime;
    const logLines = [];
    logLines.push(`Migration run at: ${new Date(migrationTime).toISOString()}`);
    logLines.push(`\nMigration type: migrate1`);
    logLines.push(`\nMigration cause: changed category data schema`);
    logLines.push(`\nMigrated count: ${migrated.length}`);
    logLines.push(`\nSkipped count: ${skipped.length}`);
    if (migrated.length) {
      logLines.push("\n!! Migrated titles:\n");
      for (let t of migrated) {
        logLines.push(`* [[${t}]]`);
      }
    }
    if (skipped.length) {
      logLines.push("\n!! Skipped titles (reason):\n");
      for (let s of skipped) {
        logLines.push(`* [[${s.title}]] (${s.reason})`);
      }
    }
    const summaryText = logLines.join("\n");
    // create or update the log tiddler
    context.wikiUtils.addTiddler({ title: logTitle, tags: [context.tags.log, context.tags.migration1], text: summaryText });
  }

})();
