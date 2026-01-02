/*\
title: test/utils.js
module-type: library

Utilities for test.

\*/

function setupWiki(wikiOptions) {
    wikiOptions = wikiOptions || {};
    // Create a wiki
    var wiki = new $tw.Wiki(wikiOptions);
    var tiddlers = [{
        title: "Root",
        text: "Some dummy content"
    }];
    wiki.addTiddlers(tiddlers);
    wiki.addIndexersToWiki();
    var widgetNode = wiki.makeTranscludeWidget("Root", { document: $tw.fakeDocument, parseAsInline: true });
    var container = $tw.fakeDocument.createElement("div");
    widgetNode.render(container, null);
    const tags = $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/tags", []);
    const prefixes = $tw.wiki.getTiddlerData("$:/plugins/midorum/zest/data/prefixes", []);
    return {
        env: $tw,
        wiki: wiki,
        widget: widgetNode,
        contaienr: container,
        push: new Pusher(wiki, tags, prefixes),
        tags: tags,
        prefixes: prefixes,
        debug: {
            all: (msg) => debugAll(wiki, tags, msg)
        }
    };
}

function debugAll(wiki, tags, msg) {
    if (msg) console.debug(msg)
    wiki.filterTiddlers(`[tag[${tags.domain}]]`).forEach(domain => {
        console.debug(wiki.getTiddler(domain));
    });
    wiki.filterTiddlers(`[tag[${tags.category}]]`).forEach(category => {
        console.debug(wiki.getTiddler(category));
    });
    wiki.filterTiddlers(`[tag[${tags.thesis}]]`).forEach(thesis => {
        console.debug(wiki.getTiddler(thesis));
    });
    wiki.filterTiddlers(`[tag[${tags.statement}]]`).forEach(thesis => {
        console.debug(wiki.getTiddler(thesis));
    });
    wiki.filterTiddlers(`[tag[${tags.log}]]`).forEach(log => {
        console.debug(wiki.getTiddler(log));
    });
}

const Pusher = function (wiki, tags, prefixes) {
    let thesisCounter = 0;

    function createDomain(name, description) {
        if (!name) throw new Error("name is required");
        const domain = {
            title: prefixes.domain + name,
            name: name,
            text: description || '',
            tags: [tags.domain]
        }
        wiki.addTiddler(domain);
        return domain;
    };

    function createCategory_v0(name, domainIds) {
        if (!name) throw new Error("name is required");
        if (!domainIds || !Array.isArray(domainIds) || domainIds.length === 0) throw new Error("domainIds is required");
        const categoryTitle = `${prefixes.category}${name}`;
        const category = {
            title: categoryTitle,
            text: name,
            tags: [tags.category, ...domainIds]
        };
        wiki.addTiddler(category);
        return category;
    }

    function createCategory_v1(name, domainIds, description) {
        if (!name) throw new Error("name is required");
        if (!domainIds || !Array.isArray(domainIds) || domainIds.length === 0) throw new Error("domainIds is required");
        const categoryTitle = `${prefixes.category}${name}`;
        const category = {
            title: categoryTitle,
            name: name,
            text: description,
            tags: [tags.category, ...domainIds]
        };
        wiki.addTiddler(category);
        return category;
    }

    function categories(list, producer) {
        // console.debug("categories", list, producer)
        if (!Array.isArray(list)) {
            throw new Error("categories list is required");
        }
        if (typeof producer !== 'function') {
            throw new Error("producer is required and shold be a function");
        }
        const result = [];
        list.forEach((category) => {
            if (!category.domains || !Array.isArray(category.domains) || category.domains.length === 0) throw new Error("domainIds is required");
            result.push(producer(category.name, category.domains.map((d) => d.title), category.description));
        });
        return result;
    }

    function createThesis_v0(text, note, correctStatements, incorrectStatements, categoryIds) {
        if (!text) throw new Error("text is required");
        if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) throw new Error("categoryIds is required");
        const idx = thesisCounter++;
        const thesisTitle = `${prefixes.thesis}thesis_${idx}`;
        const thesis = {
            title: thesisTitle,
            text: text,
            note: note,
            tags: [tags.thesis, ...categoryIds]
        };
        // Old format: statement texts directly in fields
        if (correctStatements && Array.isArray(correctStatements) && correctStatements.length > 0) {
            thesis["correct-statements"] = $tw.utils.stringifyList(correctStatements);
        }
        if (incorrectStatements && Array.isArray(incorrectStatements) && incorrectStatements.length > 0) {
            thesis["incorrect-statements"] = $tw.utils.stringifyList(incorrectStatements);
        }
        wiki.addTiddler(thesis);
        return thesis;
    }

    function createThesis_v1(text, note, correctStatements, incorrectStatements, categoryIds) {
        if (!text) throw new Error("text is required");
        if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) throw new Error("categoryIds is required");
        const idx = thesisCounter++;
        const thesisTitle = `${prefixes.thesis}thesis_${idx}`;
        const thesis = {
            title: thesisTitle,
            text: text,
            note: note,
            tags: [tags.thesis, ...categoryIds]
        };
        // New format: statement tiddlers with IDs in fields
        if (correctStatements && Array.isArray(correctStatements) && correctStatements.length > 0) {
            const correctStatementIds = [];
            correctStatements.forEach((statementText, stmtIdx) => {
                const statementTitle = `${prefixes.statement}correct_${idx}_${stmtIdx}`;
                wiki.addTiddler({
                    title: statementTitle,
                    text: statementText,
                    tags: [tags.statement, tags.statementCorrect, thesisTitle]
                });
                correctStatementIds.push(statementTitle);
            });
            thesis["correct-statements"] = $tw.utils.stringifyList(correctStatementIds);
        }
        if (incorrectStatements && Array.isArray(incorrectStatements) && incorrectStatements.length > 0) {
            const incorrectStatementIds = [];
            incorrectStatements.forEach((statementText, stmtIdx) => {
                const statementTitle = `${prefixes.statement}incorrect_${idx}_${stmtIdx}`;
                wiki.addTiddler({
                    title: statementTitle,
                    text: statementText,
                    tags: [tags.statement, tags.statementIncorrect, thesisTitle]
                });
                incorrectStatementIds.push(statementTitle);
            });
            thesis["incorrect-statements"] = $tw.utils.stringifyList(incorrectStatementIds);
        }
        wiki.addTiddler(thesis);
        return thesis;
    }

    function theses(list, producer) {
        // console.debug("theses", list, producer)
        if (!Array.isArray(list)) {
            throw new Error("theses list is required");
        }
        if (typeof producer !== 'function') {
            throw new Error("producer is required and shold be a function");
        }
        const result = [];
        list.forEach((thesis) => {
            if (!Array.isArray(thesis.categories) || thesis.categories.length === 0) {
                throw new Error("categories is required");
            }
            result.push(producer(thesis.text, thesis.note, thesis.correctStatements, thesis.incorrectStatements, thesis.categories.map((c) => c.title)));
        });
        return result;
    }

    return {
        /*
        Creates a domain with optional categories and theses
        options: {
            name: "Domain name",
            description: "Domain description",
            categories: [
                {
                    name: "Category name",
                    theses: [
                        {
                            text: "Thesis text",
                            note: "Thesis note",
                            correctStatements: ["Statement 1", "Statement 2"],
                            incorrectStatements: ["Statement 3"]
                        }
                    ]
                }
            ]
        }
        Returns: { domain: domainTiddler, categories: [categoryTiddler1, ...] }
        */
        domain: function (options) {
            options = options || {};
            const domain = createDomain(options.name, options.description);
            let categories = [];
            if (Array.isArray(options.categories)) {
                options.categories.forEach((cat) => {
                    const category = createCategory_v1(cat.name, [domain.title]);
                    categories.push(category);
                    category.theses = [];
                    if (Array.isArray(cat.theses)) {
                        cat.theses.forEach((thesis) => {
                            category.theses.push(createThesis_v1(thesis.text, thesis.note, thesis.correctStatements, thesis.incorrectStatements, [category.title]));
                        });
                    }
                });
            }
            return {
                domain: domain,
                categories: categories
            };
        },

        /*
        Creates categories in old format (v0: text field instead of name field)
        list: [
            { name: "Category name", domains: [domainTiddler1, domainTiddler2, ...] }
        ]
        Returns: [categoryTiddler1, categoryTiddler2, ...]
        */
        categories_v0: list => categories(list, createCategory_v0),

        /*
        Creates categories in new format (v1: name field + text field for description)
        list: [
            {
                name: "Category name",
                domains: [domainTiddler1, domainTiddler2, ...],
                description: "Optional description"
            }
        ]
        Returns: [categoryTiddler1, categoryTiddler2, ...]
        */
        categories_v1: list => categories(list, createCategory_v1),

        /*
        Alias for categories_v1
        */
        categories_last: function (list) { return this.categories_v1(list) },

        /*
        Creates theses in old format (v0: statement texts directly in fields)
        list: [
            {
                text: "Thesis text",
                note: "Thesis note",
                correctStatements: ["Statement 1", "Statement 2"],
                incorrectStatements: ["Statement 3"],
                categories: [categoryTiddler1, categoryTiddler2, ...]
            }
        ]
        Returns: [thesisTiddler1, thesisTiddler2, ...]
        */
        theses_v0: list => theses(list, createThesis_v0),

        /*
        Creates theses in new format (v1: statement tiddlers with IDs in fields)
        list: [
            {
                text: "Thesis text",
                note: "Thesis note",
                correctStatements: ["Statement 1", "Statement 2"],
                incorrectStatements: ["Statement 3"],
                categories: [categoryTiddler1, categoryTiddler2, ...]
            }
        ]
        Returns: [thesisTiddler1, thesisTiddler2, ...]
        */
        theses_v1: list => theses(list, createThesis_v1),

        /*
        Alias for theses_v1
        */
        theses_last: function (list) { return this.theses_v1(list) },

        /*
        Creates temporary statement tiddlers for testing
        statements: [
            { isCorrect: true, text: "A is true", tag: "$:/temp/test/correct" },
            { isCorrect: false, text: "B is false", tag: "$:/temp/test/incorrect" }
        ]
        */
        tempStatements: function (statements) {
            if (!Array.isArray(statements)) {
                throw new Error("statements is required and should be an array");
            }
            const result = [];
            statements.forEach((statement, idx) => {
                if (statement.text === undefined) {
                    throw new Error("statement text is required");
                }
                if (statement.tag === undefined) {
                    throw new Error("statement tag is required");
                }
                const baseTitle = statement.isCorrect ? "$:/temp/stmt_c" : "$:/temp/stmt_i";
                const title = `${baseTitle}${idx}`;
                wiki.addTiddler({
                    title: title,
                    text: statement.text,
                    tags: [statement.tag]
                });
                result.push(title);
            });
            return result;
        },
    };
};

exports.zestTestUtils = {
    setupWiki: setupWiki,
}
