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

  /**
   * Extract and deduplicate valid statement texts from temporary tiddlers.
   * @param {Array<string>} tempTiddlerTitles - Array of temporary statement tiddler titles.
   * @param {Object} context - Context object with wikiUtils.
   * @returns {Array<string>} - Array of unique non-empty statement texts.
   */
  function extractValidStatementTexts(tempTiddlerTitles, context) {
    const texts = [];
    const seenTexts = new Set();

    tempTiddlerTitles.forEach(tempTitle => {
      const tempTiddler = context.wikiUtils.withTiddler(tempTitle, true);
      if (tempTiddler.exists()) {
        const text = utils.trimToUndefined(tempTiddler.getTiddlerField("text"));
        if (text && !seenTexts.has(text)) {
          seenTexts.add(text);
          texts.push(text);
        }
      }
    });

    return texts;
  }

  /**
   * Validate temporary statement tiddlers.
   * Checks that either both correct and incorrect statements are provided with valid content,
   * or neither is provided.
   * @param {Array<string>} correctStatementTiddlers - Array of correct statement tiddler titles.
   * @param {Array<string>} incorrectStatementTiddlers - Array of incorrect statement tiddler titles.
   * @param {Object} context - Context object with wikiUtils.
   * @returns {Object} - { status: 'error'|'remove'|'create', error: string|null }
   *   - 'error': validation failed, show error message
   *   - 'remove': no valid statements, remove existing statement fields
   *   - 'create': valid statements in both groups, create new statement tiddlers
   */
  function validateStatementTiddlers(correctStatementTiddlers, incorrectStatementTiddlers, context) {
    // Check that both or none are provided at tiddler level
    if ((correctStatementTiddlers.length > 0 && incorrectStatementTiddlers.length === 0) ||
      (correctStatementTiddlers.length === 0 && incorrectStatementTiddlers.length > 0)) {
      return {
        status: 'error',
        error: "Both thesis correct statements and incorrect statements must be provided together"
      };
    }

    // If both are empty, remove existing statements
    if (correctStatementTiddlers.length === 0 && incorrectStatementTiddlers.length === 0) {
      return {
        status: 'remove',
        error: null
      };
    }

    // Extract valid texts after filtering empty content
    const validCorrectTexts = extractValidStatementTexts(correctStatementTiddlers, context);
    const validIncorrectTexts = extractValidStatementTexts(incorrectStatementTiddlers, context);

    // Check that after filtering, both groups still have valid statements
    if ((validCorrectTexts.length > 0 && validIncorrectTexts.length === 0) ||
      (validCorrectTexts.length === 0 && validIncorrectTexts.length > 0)) {
      return {
        status: 'error',
        error: "Both thesis correct statements and incorrect statements must be provided together"
      };
    }

    // If both have valid content, create new statements
    if (validCorrectTexts.length > 0 && validIncorrectTexts.length > 0) {
      return {
        status: 'create',
        error: null
      };
    }

    // If all statements were empty, remove existing statements
    return {
      status: 'remove',
      error: null
    };
  }

  /**
   * Creates permanent statement tiddlers from temporary statement tiddlers.
   * Deduplicates statements by text content.
   * @param {Array<string>} tempTiddlerTitles - Array of temporary statement tiddler titles.
   * @param {boolean} isCorrect - True if these are correct statements, false for incorrect.
   * @param {string} thesisId - ID of the thesis these statements belong to.
   * @param {Object} context - Context object with wikiUtils, prefixes, tags.
   * @returns {Array<string>} - Array of created permanent statement tiddler IDs.
   */
  function createStatementTiddlersFromTemp(tempTiddlerTitles, isCorrect, thesisId, context) {
    const statementIds = [];
    const statementPrefix = context.prefixes.statement;
    const statementTag = context.tags.statement;
    const correctnessTag = isCorrect ? context.tags.statementCorrect : context.tags.statementIncorrect;
    const seenTexts = new Set();  // For deduplication

    tempTiddlerTitles.forEach(tempTitle => {
      const tempTiddler = context.wikiUtils.withTiddler(tempTitle, true);
      if (tempTiddler.exists()) {
        const text = utils.trimToUndefined(tempTiddler.getTiddlerField("text"));
        if (text && !seenTexts.has(text)) {
          seenTexts.add(text);
          const statementTitle = context.wikiUtils.generateNewInternalTitle(statementPrefix);
          const statementFields = {
            title: statementTitle,
            text: text,
            tags: [statementTag, correctnessTag, thesisId]
          };
          context.wikiUtils.addTiddler(statementFields);
          statementIds.push(statementTitle);
        }
      }
    });

    return statementIds;
  }

  /**
   * Deletes statement tiddlers by their IDs.
   * @param {Array<string>|string} statementIds - Array of statement IDs or string list of IDs.
   * @param {Object} context - Context object with wikiUtils.
   */
  function deleteStatementTiddlers(statementIds, context) {
    const ids = Array.isArray(statementIds) ? statementIds : utils.parseStringList(statementIds, false);
    ids.forEach(id => {
      const tiddler = context.wikiUtils.withTiddler(id, true);
      if (tiddler.exists()) {
        tiddler.doNotInvokeSequentiallyOnSameTiddler.deleteTiddler();
      }
    });
  }

  /**
   * Deletes a thesis tiddler and all its associated statement tiddlers.
   * @param {Object} thesisTiddler - Thesis tiddler wrapper object.
   * @param {Object} context - Context object with wikiUtils.
   */
  function deleteThesisTiddler(thesisTiddler, context) {
    // Delete associated statement tiddlers before deleting the thesis
    const correctStatements = thesisTiddler.getTiddlerField("correct-statements");
    const incorrectStatements = thesisTiddler.getTiddlerField("incorrect-statements");
    if (correctStatements) {
      deleteStatementTiddlers(correctStatements, context);
    }
    if (incorrectStatements) {
      deleteStatementTiddlers(incorrectStatements, context);
    }
    thesisTiddler.doNotInvokeSequentiallyOnSameTiddler.deleteTiddler();
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
   * @param {string} [params.correctStatementsTag] - Optional tag to find temporary correct statement tiddlers.
   * @param {string} [params.incorrectStatementsTag] - Optional tag to find temporary incorrect statement tiddlers.
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
    const correctStatementsTag = utils.trimToUndefined(params.correctStatementsTag);
    const incorrectStatementsTag = utils.trimToUndefined(params.incorrectStatementsTag);
    if (!name) {
      context.logger.alert(utils.formatString(alertMsg, "category name"));
      return;
    }
    if (!domainId) {
      context.logger.alert(utils.formatString(alertMsg, "domain id"));
      return;
    }
    const correctStatementTiddlers = correctStatementsTag ?
      context.wikiUtils.allTitlesWithTag(correctStatementsTag) || [] : [];
    const incorrectStatementTiddlers = incorrectStatementsTag ?
      context.wikiUtils.allTitlesWithTag(incorrectStatementsTag) || [] : [];
    const validation = validateStatementTiddlers(correctStatementTiddlers, incorrectStatementTiddlers, context);
    if (validation.status === 'error') {
      context.logger.alert(validation.error);
      return;
    }
    if ((thesisNote || validation.status === 'create') && !thesisText) {
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
    if (validation.status === 'create') {
      const correctStatementIds = createStatementTiddlersFromTemp(correctStatementTiddlers, true, thesisTitle, context);
      const incorrectStatementIds = createStatementTiddlersFromTemp(incorrectStatementTiddlers, false, thesisTitle, context);
      thesisFields["correct-statements"] = utils.stringifyList(correctStatementIds);
      thesisFields["incorrect-statements"] = utils.stringifyList(incorrectStatementIds);
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
    // - if it is linked exclusively to this category, delete the thesis and its statements
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
        // Only linked to this category: delete the thesis and its statements
        deleteThesisTiddler(thesisTiddler, context);
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
   * @param {string} [params.correctStatementsTag] - Optional tag to find temporary correct statement tiddlers.
   * @param {string} [params.incorrectStatementsTag] - Optional tag to find temporary incorrect statement tiddlers.
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
    const correctStatementsTag = utils.trimToUndefined(params.correctStatementsTag);
    const incorrectStatementsTag = utils.trimToUndefined(params.incorrectStatementsTag);
    if (!categoryId) {
      context.logger.alert("Category id is required");
      return;
    }
    if (!thesisText) {
      context.logger.alert("Thesis text cannot be empty");
      return;
    }
    const correctStatementTiddlers = correctStatementsTag ?
      context.wikiUtils.allTitlesWithTag(correctStatementsTag) || [] : [];
    const incorrectStatementTiddlers = incorrectStatementsTag ?
      context.wikiUtils.allTitlesWithTag(incorrectStatementsTag) || [] : [];
    const validation = validateStatementTiddlers(correctStatementTiddlers, incorrectStatementTiddlers, context);
    if (validation.status === 'error') {
      context.logger.alert(validation.error);
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
    if (validation.status === 'create') {
      const correctStatementIds = createStatementTiddlersFromTemp(correctStatementTiddlers, true, thesisTitle, context);
      const incorrectStatementIds = createStatementTiddlersFromTemp(incorrectStatementTiddlers, false, thesisTitle, context);
      thesisFields["correct-statements"] = utils.stringifyList(correctStatementIds);
      thesisFields["incorrect-statements"] = utils.stringifyList(incorrectStatementIds);
    }
    context.wikiUtils.addTiddler(thesisFields);
  };

  /**
   * Update thesis text and note.
   * @param {Object} params - Parameters object.
   * @param {string} params.id - Thesis tiddler id. (required)
   * @param {string} params.text - New thesis text. (required)
   * @param {string} [params.note] - New thesis note.
   * @param {string} [params.correctStatementsTag] - Optional tag to find temporary correct statement tiddlers.
   * @param {string} [params.incorrectStatementsTag] - Optional tag to find temporary incorrect statement tiddlers.
   * @throws Alerts if id is missing, thesis not found, or text is empty, or statement validation fails.
   */
  exports.updateThesis = function (params, widget, env) {
    const context = {
      wikiUtils: utils.getWikiUtils(widget.wiki),
      env: env,
      logger: new $tw.utils.Logger("Zest:updateThesis"),
      prefixes: $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/prefixes", []),
      tags: $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/tags", []),
    };
    const thesisId = utils.trimToUndefined(params.id);
    const correctStatementsTag = utils.trimToUndefined(params.correctStatementsTag);
    const incorrectStatementsTag = utils.trimToUndefined(params.incorrectStatementsTag);
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
    const correctStatementTiddlers = correctStatementsTag ?
      context.wikiUtils.allTitlesWithTag(correctStatementsTag) || [] : [];
    const incorrectStatementTiddlers = incorrectStatementsTag ?
      context.wikiUtils.allTitlesWithTag(incorrectStatementsTag) || [] : [];
    const validation = validateStatementTiddlers(correctStatementTiddlers, incorrectStatementTiddlers, context);
    if (validation.status === 'error') {
      context.logger.alert(validation.error);
      return;
    }
    const updateFields = {};
    updateFields.text = newText;
    updateFields.note = newNote;
    const oldCorrectStatements = thesisTiddler.getTiddlerField("correct-statements");
    const oldIncorrectStatements = thesisTiddler.getTiddlerField("incorrect-statements");
    if (validation.status === 'remove') {
      updateFields["correct-statements"] = undefined;
      updateFields["incorrect-statements"] = undefined;
      if (oldCorrectStatements) {
        deleteStatementTiddlers(oldCorrectStatements, context);
      }
      if (oldIncorrectStatements) {
        deleteStatementTiddlers(oldIncorrectStatements, context);
      }
    } else if (validation.status === 'create') {
      const correctStatementIds = createStatementTiddlersFromTemp(correctStatementTiddlers, true, thesisId, context);
      const incorrectStatementIds = createStatementTiddlersFromTemp(incorrectStatementTiddlers, false, thesisId, context);
      updateFields["correct-statements"] = utils.stringifyList(correctStatementIds);
      updateFields["incorrect-statements"] = utils.stringifyList(incorrectStatementIds);
      if (oldCorrectStatements) {
        deleteStatementTiddlers(oldCorrectStatements, context);
      }
      if (oldIncorrectStatements) {
        deleteStatementTiddlers(oldIncorrectStatements, context);
      }
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
   * Delete a thesis and its associated statement tiddlers.
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
    deleteThesisTiddler(thesisTiddler, context);
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

  /**
   * Migration 2: Convert old format statements (text in string list) to new format (statement tiddlers).
   * Old format: correct-statements and incorrect-statements fields contain string lists of statement texts
   * New format: correct-statements and incorrect-statements fields contain string lists of statement tiddler IDs
   * @param {Object} params - Parameters object (unused for this migration).
   */
  exports.migrate2 = function (params, widget, env) {
    const context = {
      wikiUtils: utils.getWikiUtils(widget.wiki),
      env: env,
      logger: new $tw.utils.Logger("Zest:migrate2"),
      tags: $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/tags", []),
      prefixes: $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/prefixes", []),
    };
    const thesisTag = context.tags.thesis;
    const allTheses = context.wikiUtils.allTitlesWithTag(thesisTag) || [];
    const migrationTime = Date.now();
    const migrated = [];
    const skipped = [];

    for (let thesisTitle of allTheses) {
      const thesisTiddler = context.wikiUtils.withTiddler(thesisTitle);
      if (!thesisTiddler.exists()) {
        skipped.push({ title: thesisTitle, reason: "not found" });
        continue;
      }

      // Check if already migrated
      const alreadyMigrated = thesisTiddler.getTiddlerField("zest-migrated-2");
      if (alreadyMigrated) {
        skipped.push({ title: thesisTitle, reason: "already migrated" });
        continue;
      }

      // Get old format statement fields
      const oldCorrectStatements = thesisTiddler.getTiddlerField("correct-statements");
      const oldIncorrectStatements = thesisTiddler.getTiddlerField("incorrect-statements");

      // If no statements, skip (but mark as migrated)
      if (!oldCorrectStatements && !oldIncorrectStatements) {
        thesisTiddler.doNotInvokeSequentiallyOnSameTiddler.updateTiddler({ "zest-migrated-2": String(migrationTime) });
        skipped.push({ title: thesisTitle, reason: "no statements" });
        continue;
      }

      // Parse old format statement texts
      const correctStatementTexts = oldCorrectStatements ? utils.parseStringList(oldCorrectStatements, false) : [];
      const incorrectStatementTexts = oldIncorrectStatements ? utils.parseStringList(oldIncorrectStatements, false) : [];

      // Check if statements look like IDs (new format) rather than texts
      // Simple heuristic: if all statements start with "$:/zest/db/statement/", assume already new format
      const allCorrectLookLikeIds = correctStatementTexts.every(s => s.startsWith("$:/zest/db/statement/"));
      const allIncorrectLookLikeIds = incorrectStatementTexts.every(s => s.startsWith("$:/zest/db/statement/"));

      if ((correctStatementTexts.length === 0 || allCorrectLookLikeIds) &&
        (incorrectStatementTexts.length === 0 || allIncorrectLookLikeIds)) {
        thesisTiddler.doNotInvokeSequentiallyOnSameTiddler.updateTiddler({ "zest-migrated-2": String(migrationTime) });
        skipped.push({ title: thesisTitle, reason: "already new format" });
        continue;
      }

      // Create new statement tiddlers
      const correctStatementIds = [];
      const incorrectStatementIds = [];

      correctStatementTexts.forEach(text => {
        const trimmed = utils.trimToUndefined(text);
        if (trimmed) {
          const statementTitle = context.wikiUtils.generateNewInternalTitle(context.prefixes.statement);
          context.wikiUtils.addTiddler({
            title: statementTitle,
            text: trimmed,
            tags: [context.tags.statement, context.tags.statementCorrect, thesisTitle]
          });
          correctStatementIds.push(statementTitle);
        }
      });

      incorrectStatementTexts.forEach(text => {
        const trimmed = utils.trimToUndefined(text);
        if (trimmed) {
          const statementTitle = context.wikiUtils.generateNewInternalTitle(context.prefixes.statement);
          context.wikiUtils.addTiddler({
            title: statementTitle,
            text: trimmed,
            tags: [context.tags.statement, context.tags.statementIncorrect, thesisTitle]
          });
          incorrectStatementIds.push(statementTitle);
        }
      });

      // Update thesis with new statement ID lists
      const updateFields = {
        "correct-statements": correctStatementIds.length > 0 ? utils.stringifyList(correctStatementIds) : undefined,
        "incorrect-statements": incorrectStatementIds.length > 0 ? utils.stringifyList(incorrectStatementIds) : undefined,
        "zest-migrated-2": String(migrationTime)
      };

      thesisTiddler.doNotInvokeSequentiallyOnSameTiddler.updateTiddler(updateFields);
      migrated.push(thesisTitle);
    }

    // Write migration summary to a log tiddler
    const logTitle = context.prefixes.log + "migrate2_" + migrationTime;
    const logLines = [];
    logLines.push(`Migration run at: ${new Date(migrationTime).toISOString()}`);
    logLines.push(`\nMigration type: migrate2`);
    logLines.push(`\nMigration cause: changed statement storage from text lists to separate tiddlers`);
    logLines.push(`\nMigrated count: ${migrated.length}`);
    logLines.push(`\nSkipped count: ${skipped.length}`);
    if (migrated.length) {
      logLines.push("\n!! Migrated thesis titles:\n");
      for (let t of migrated) {
        logLines.push(`* [[${t}]]`);
      }
    }
    if (skipped.length) {
      logLines.push("\n!! Skipped thesis titles (reason):\n");
      for (let s of skipped) {
        logLines.push(`* [[${s.title}]] (${s.reason})`);
      }
    }
    const summaryText = logLines.join("\n");
    context.wikiUtils.addTiddler({ title: logTitle, tags: [context.tags.log, context.tags.migration2], text: summaryText });

    context.logger.alert(`Migration 2 complete: ${migrated.length} migrated, ${skipped.length} skipped`);
  }

})();
