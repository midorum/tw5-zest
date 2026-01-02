const utils = require("test/utils").zestTestUtils;
const messageHandler = require("$:/plugins/midorum/zest/modules/message-handler.js");
const Logger = $tw.utils.Logger.prototype;

describe("The attachThesis service", () => {
    var consoleSpy;
    var consoleDebugSpy;
    var loggerSpy;

    beforeEach(function () {
        consoleSpy = spyOn(console, 'log');
        consoleDebugSpy = spyOn(console, 'debug');
        loggerSpy = spyOn(Logger, 'alert');
    });

    it("should be defined", () => {
        expect(messageHandler.attachThesis).toBeDefined();
    });

    it("should fail when the 'thesisId' argument is not passed", () => {
        const options = utils.setupWiki();
        const params = { thesisId: undefined, categoryId: "$:/zest/db/category/1" };
        const expectedMessage = "Thesis id is required";
        expect(messageHandler.attachThesis(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail when the 'categoryId' argument is not passed", () => {
        const options = utils.setupWiki();
        const params = { thesisId: "$:/zest/db/thesis/1", categoryId: undefined };
        const expectedMessage = "Category id is required";
        expect(messageHandler.attachThesis(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail when the thesis does not exist", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: "Domain1", description: "Domain1 description" });
        const categories = options.push.categories_last([
            { name: "Category1", domains: [domain.domain] },
        ])
        const params = {
            thesisId: "$:/zest/db/thesis/nonexistent",
            categoryId: categories[0].title
        };
        const expectedMessage = "Thesis not found";
        expect(messageHandler.attachThesis(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail when the category does not exist", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({
            name: 'Domain1',
            categories: [{
                name: 'Category1',
                theses: [{ text: 'Thesis1' }]
            }]
        });
        const params = {
            thesisId: domain.categories[0].theses[0].title,
            categoryId: "$:/zest/db/category/nonexistent"
        };
        const expectedMessage = "Category not found";
        expect(messageHandler.attachThesis(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should attach the thesis to the category when all parameters are valid", () => {
        const options = utils.setupWiki();
        // Create two categories with a thesis in the first one
        const domain = options.push.domain({ name: "Domain1", description: "Domain1 description" });
        const categories = options.push.categories_last([
            { name: "Category1", domains: [domain.domain] },
            { name: "Category2", domains: [domain.domain] }
        ])
        const theses = options.push.theses_last([
            { text: "Thesis1", note: "Thesis1 note", categories: categories.slice(0, 1) },
        ])
        const params = {
            thesisId: theses[0].title,
            categoryId: categories[1].title
        };
        messageHandler.attachThesis(params, options.widget, options.env);
        expect(Logger.alert).toHaveBeenCalledTimes(0);
        const tiddler = options.wiki.getTiddler(theses[0].title);
        expect(tiddler.fields.tags).toContain(categories[0].title);
        expect(tiddler.fields.tags).toContain(categories[1].title);
    });
});
