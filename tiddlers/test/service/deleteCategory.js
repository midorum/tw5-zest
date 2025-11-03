const utils = require("test/utils").zestTestUtils;
const messageHandler = require("$:/plugins/midorum/zest/modules/message-handler.js");
const Logger = $tw.utils.Logger.prototype;

describe("The deleteCategory service", () => {
    var consoleSpy;
    var consoleDebugSpy;
    var loggerSpy;

    beforeEach(function () {
        consoleSpy = spyOn(console, 'log');
        consoleDebugSpy = spyOn(console, 'debug');
        loggerSpy = spyOn(Logger, 'alert');
    });

    it("should be defined", () => {
        expect(messageHandler.deleteCategory).toBeDefined();
    });

    it("should fail when the 'id' argument is not passed", () => {
        const options = utils.setupWiki();
        const params = { id: undefined };
        const expectedMessage = "Category id is required";
        expect(messageHandler.deleteCategory(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail when the category does not exist", () => {
        const options = utils.setupWiki();
        const params = { id: "$:/zest/db/category/nonexistent" };
        const expectedMessage = "Category not found";
        expect(messageHandler.deleteCategory(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should delete the category and all theses that are linked only to this category and detach other linked theses", () => {
        // consoleDebugSpy.and.callThrough();
        const options = utils.setupWiki();
        const domains = options.push.domains([
            { name: "Domain1", description: "Domain1 description" },
            { name: "Domain2", description: "Domain2 description" },
        ]);
        const categories = options.push.categories([
            { name: "Category1", domains: domains },
            { name: "Category2", domains: domains.slice(1) }
        ])
        const theses = options.push.theses([
            { text: "Thesis1", note: "Thesis1 note", categories: categories.slice(0, 1) },
            { text: "Thesis2", note: "Thesis2 note", categories: categories },
            { text: "Thesis3", note: "Thesis3 note", categories: categories.slice(1) }
        ])
        options.wiki.filterTiddlers(`[tag[${options.tags.domain}]]`).forEach(domain => {
            console.debug(options.wiki.getTiddler(domain));
        });
        options.wiki.filterTiddlers(`[tag[${options.tags.category}]]`).forEach(category => {
            console.debug(options.wiki.getTiddler(category));
        });
        options.wiki.filterTiddlers(`[tag[${options.tags.thesis}]]`).forEach(thesis => {
            console.debug(options.wiki.getTiddler(thesis));
        });
        expect(options.wiki.filterTiddlers(`[tag[${options.tags.thesis}]tag[${categories[0].title}]]`).length).toEqual(2);
        expect(options.wiki.filterTiddlers(`[tag[${options.tags.thesis}]tag[${categories[1].title}]]`).length).toEqual(2);
        const params = { id: categories[0].title };
        messageHandler.deleteCategory(params, options.widget, options.env);
        expect(options.wiki.getTiddler(categories[0].title)).toBeUndefined();
        expect(options.wiki.getTiddler(categories[1].title)).toBeDefined();
        expect(options.wiki.filterTiddlers(`[tag[${options.tags.thesis}]tag[${categories[0].title}]]`).length).toBe(0);
        expect(options.wiki.getTiddler(theses[0].title)).toBeUndefined();
        expect(options.wiki.getTiddler(theses[1].title)).toBeDefined();
        expect(options.wiki.getTiddler(theses[2].title)).toBeDefined();
    });
});
