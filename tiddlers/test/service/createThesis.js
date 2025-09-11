const utils = require("test/utils").zestTestUtils;
const messageHandler = require("$:/plugins/midorum/zest/modules/message-handler.js");
const Logger = $tw.utils.Logger.prototype;

describe("The createThesis service", () => {
    var consoleSpy;
    var consoleDebugSpy;
    var loggerSpy;

    beforeEach(function () {
        consoleSpy = spyOn(console, 'log');
        consoleDebugSpy = spyOn(console, 'debug');
        loggerSpy = spyOn(Logger, 'alert');
    });

    it("should be defined", () => {
        expect(messageHandler.createThesis).toBeDefined();
    });

    it("should fail when the 'text' argument is not passed", () => {
        const options = utils.setupWiki();
        const params = { text: undefined, categoryId: "$:/zest/db/category/1" };
        const expectedMessage = "Thesis text cannot be empty";
        expect(messageHandler.createThesis(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail when the 'categoryId' argument is not passed", () => {
        const options = utils.setupWiki();
        const params = { text: "Some thesis", categoryId: undefined };
        const expectedMessage = "Category id is required";
        expect(messageHandler.createThesis(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should create a thesis tiddler with correct fields and tags", () => {
        // consoleDebugSpy.and.callThrough();
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1', categories: [{ name: 'Category1', theses: [{ text: 'Thesis1' }] }] });
        const categoryId = domain.categories[0].title;
        const params = { text: "New thesis", note: "Some note", categoryId: categoryId };
        messageHandler.createThesis(params, options.widget, options.env);
        console.debug("domains", options.wiki.filterTiddlers(`[tag[${options.tags.domain}]]`));
        console.debug("categories", options.wiki.filterTiddlers(`[tag[${options.tags.category}]]`));
        console.debug("theses", options.wiki.filterTiddlers(`[tag[${options.tags.thesis}]]`));
        const thesisTag = options.tags.thesis;
        const allTheses = options.wiki.getTiddlersWithTag(thesisTag);
        expect(allTheses.length).toEqual(2);
        const thesisTiddler = allTheses.map(t => options.wiki.getTiddler(t)).filter(t => t.fields.text === params.text).at(0);
        expect(thesisTiddler).toBeDefined();
        console.debug(thesisTiddler);
        expect(thesisTiddler.fields.text).toBe(params.text);
        expect(thesisTiddler.fields.note).toBe(params.note);
        expect(thesisTiddler.fields.tags).toContain(thesisTag);
        expect(thesisTiddler.fields.tags).toContain(categoryId);
        expect(thesisTiddler.fields.tags).toContain("$:/srs/tags/scheduledForward");
    });
});
