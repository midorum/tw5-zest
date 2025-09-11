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
    };
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

    function createCategory(name, domainIds) {
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

    function createThesis(text, note, categoryId, idx) {
        if (!text) throw new Error("text is required");
        if (!categoryId) throw new Error("categoryId is required");
        const thesisTitle = `${prefixes.thesis}${categoryId.substring(prefixes.category.length)}_thesis_${idx || 0}`;
        const thesis = {
            title: thesisTitle,
            text: text,
            note: note,
            tags: [tags.thesis, categoryId]
        };
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
                            note: "some note"
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
                    const category = createCategory(cat.name, [domain.title]);
                    categories.push(category);
                    if (!Array.isArray(cat.theses)) {
                        throw new Error("theses is required");
                    }
                    category.theses = [];
                    cat.theses.forEach((thesis, idx) => {
                        category.theses.push(createThesis(thesis.text, thesis.note, category.title, idx));
                    });
                });
            }
            return {
                domain: domain,
                categories: categories
            };
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
