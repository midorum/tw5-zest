const utils = require("test/utils").zestTestUtils;
const messageHandler = require("$:/plugins/midorum/zest/modules/message-handler.js");
const Logger = $tw.utils.Logger.prototype;

describe("The detachThesis service", () => {
    var consoleSpy;
    var consoleDebugSpy;
    var loggerSpy;

    beforeEach(function () {
        consoleSpy = spyOn(console, 'log');
        consoleDebugSpy = spyOn(console, 'debug');
        loggerSpy = spyOn(Logger, 'alert');
    });

    it("should be defined", () => {
        expect(messageHandler.detachThesis).toBeDefined();
    });

    it("should fail when the 'thesisId' argument is not passed", () => {
        const options = utils.setupWiki();
        const params = { thesisId: undefined, categoryId: "$:/zest/db/category/1" };
        const expectedMessage = "Thesis id is required";
        expect(messageHandler.detachThesis(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail when the 'categoryId' argument is not passed", () => {
        const options = utils.setupWiki();
        const params = { thesisId: "$:/zest/db/thesis/1", categoryId: undefined };
        const expectedMessage = "Category id is required";
        expect(messageHandler.detachThesis(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail when the thesis does not exist", () => {
        const options = utils.setupWiki();
        const domains = options.push.domains([
            { name: "Domain1" },
        ]);
        const categories = options.push.categories([
            { name: "Category1", domains: domains },
        ])
        const params = { thesisId: "$:/zest/db/thesis/nonexistent", categoryId: categories[0].title };
        const expectedMessage = "Thesis not found";
        expect(messageHandler.detachThesis(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail when the category does not exist", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1', categories: [{ name: 'Category1', theses: [{ text: 'Thesis1' }] }] });
        const params = { thesisId: domain.categories[0].theses[0].title, categoryId: "$:/zest/db/category/nonexistent" };
        const expectedMessage = "Category not found";
        expect(messageHandler.detachThesis(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail when the thesis is not linked to the category", () => {
        const options = utils.setupWiki();
        const domains = options.push.domains([
            { name: "Domain1" },
        ]);
        const categories = options.push.categories([
            { name: "Category1", domains: domains },
            { name: "Category2", domains: domains }
        ])
        const theses = options.push.theses([
            { text: "Thesis1", categories: categories.slice(0, 1) },
        ])
        const params = { thesisId: theses[0].title, categoryId: categories[1].title };
        const expectedMessage = "Thesis is not linked to this category";
        expect(messageHandler.detachThesis(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail when the thesis is linked to only one category", () => {
        const options = utils.setupWiki();
        const domains = options.push.domains([
            { name: "Domain1" },
        ]);
        const categories = options.push.categories([
            { name: "Category1", domains: domains },
            { name: "Category2", domains: domains }
        ])
        const theses = options.push.theses([
            { text: "Thesis1", categories: categories.slice(0, 1) },
        ])
        const params = { thesisId: theses[0].title, categoryId: categories[0].title };
        const expectedMessage = "Cannot detach: thesis must be linked to at least one category";
        messageHandler.detachThesis(params, options.widget, options.env);
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should detach the category from the thesis if more than one category is linked", () => {
        // loggerSpy.and.callThrough();
        const options = utils.setupWiki();
        const domains = options.push.domains([
            { name: "Domain1" },
        ]);
        const categories = options.push.categories([
            { name: "Category1", domains: domains },
            { name: "Category2", domains: domains }
        ])
        const theses = options.push.theses([
            { text: "Thesis1", categories: categories },
        ])
        const params = { thesisId: theses[0].title, categoryId: categories[1].title };
        messageHandler.detachThesis(params, options.widget, options.env);
        expect(Logger.alert).toHaveBeenCalledTimes(0);
        const tiddler = options.wiki.getTiddler(theses[0].title);
        expect(tiddler.fields.tags).toContain(categories[0].title);
        expect(tiddler.fields.tags).not.toContain(categories[1].title);
    });
});
