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
    wiki.filterTiddlers(`[tag[${tags.log}]]`).forEach(log => {
        console.debug(wiki.getTiddler(log));
    });
}

const Pusher = function (wiki, tags, prefixes) {
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

    function createThesis(text, note, correctStatements, incorrectStatements, categoryIds, idx) {
        if (!text) throw new Error("text is required");
        if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) throw new Error("categoryIds is required");
        const thesisTitle = `${prefixes.thesis}thesis_${idx || 0}`;
        const thesis = {
            title: thesisTitle,
            text: text,
            note: note,
            tags: [tags.thesis, ...categoryIds]
        };
        if (correctStatements) {
            thesis["correct-statements"] = $tw.utils.stringifyList(correctStatements);
        }
        if (incorrectStatements) {
            thesis["incorrect-statements"] = $tw.utils.stringifyList(incorrectStatements);
        }
        wiki.addTiddler(thesis);
        return thesis;
    }

    return {
        /*
        options: {
            name: "some name",
            description: "some description",
            categories: [
                {
                    name: "some name",
                    theses: [
                        {
                            text: "some text",
                            note: "some note",
                            correctStatements: ["statement1", "statement2"],
                            incorrectStatements: ["statement3", "statement4"]
                        }
                    ]
                }
            ]
        }
        */
        domain: function (options) {
            options = options || {};
            const domain = createDomain(options.name, options.description);
            let categories = [];
            if (Array.isArray(options.categories)) {
                options.categories.forEach((cat) => {
                    const category = createCategory_v1(cat.name, [domain.title]);
                    categories.push(category);
                    if (!Array.isArray(cat.theses)) {
                        throw new Error("theses is required");
                    }
                    category.theses = [];
                    cat.theses.forEach((thesis, idx) => {
                        category.theses.push(createThesis(thesis.text, thesis.note, thesis.correctStatements, thesis.incorrectStatements, [category.title], idx));
                    });
                });
            }
            return {
                domain: domain,
                categories: categories
            };
        },
        domains: function (domains) {
            if (!Array.isArray(domains)) {
                throw new Error("domains is required");
            }
            const result = [];
            domains.forEach((domain) => {
                result.push(createDomain(domain.name, domain.description));
            });
            return result;
        },
        categories_v0: list => categories(list, createCategory_v0),
        categories_v1: list => categories(list, createCategory_v1),
        categories_last: function (list) { return this.categories_v1(list) },
        categories: function (categories) {
            if (!Array.isArray(categories)) {
                throw new Error("categories is required");
            }
            const result = [];
            categories.forEach((category) => {
                result.push(createCategory_v0(category.name, category.domains.map((d) => d.title)));
            });
            return result;
        },
        theses: function (theses) {
            if (!Array.isArray(theses)) {
                throw new Error("theses is required");
            }
            const result = [];
            theses.forEach((thesis, idx) => {
                if (!Array.isArray(thesis.categories) || thesis.categories.length === 0) {
                    throw new Error("categories is required");
                }
                result.push(createThesis(thesis.text, thesis.note, thesis.correctStatements, thesis.incorrectStatements, thesis.categories.map((c) => c.title), idx));
            });
            return result;
        },
        /*
        options: {
            description: "some description",
            tags: ["tag1", ...],
            scheduledForward: {
                due: 1585688400000,
                last: 1585688390000
            },
            scheduledBackward: {
                due: 1585688400000,
                last: 1585688390000
            }
        }
        */
    };
};

exports.zestTestUtils = {
    setupWiki: setupWiki,
}
