const utils = require("test/utils").zestTestUtils;
const messageHandler = require("$:/plugins/midorum/zest/modules/message-handler.js");
const Logger = $tw.utils.Logger.prototype;

describe("The updateCategory service", () => {
    var consoleSpy;
    var consoleDebugSpy;
    var loggerSpy;

    beforeEach(function () {
        consoleSpy = spyOn(console, 'log');
        consoleDebugSpy = spyOn(console, 'debug');
        loggerSpy = spyOn(Logger, 'alert');
    });

    it("should be defined", () => {
        expect(messageHandler.updateCategory).toBeDefined();
    });

    it("should fail when the 'id' argument is not passed", () => {
        const options = utils.setupWiki();
        const params = { id: undefined, name: "NewName" };
        const expectedMessage = "Category id is required";
        expect(messageHandler.updateCategory(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail when the category does not exist", () => {
        const options = utils.setupWiki();
        const params = { id: "$:/zest/db/category/nonexistent", name: "NewName" };
        const expectedMessage = "Category not found";
        expect(messageHandler.updateCategory(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail when the 'name' argument is not passed", () => {
        // consoleDebugSpy.and.callThrough();
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain', categories: [{ name: 'Category', theses: [{ text: 'Thesis' }] }] });
        const params = { id: domain.categories[0].title, name: undefined };
        const expectedMessage = "Category name cannot be empty";
        expect(messageHandler.updateCategory(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should update the category when all parameters are valid", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain', categories: [{ name: 'Category', theses: [{ text: 'Thesis' }] }] });
        const params = {
            id: domain.categories[0].title,
            name: "NewCategoryName",
            description: "NewCategoryName Description"
        };
        messageHandler.updateCategory(params, options.widget, options.env);
        expect(Logger.alert).toHaveBeenCalledTimes(0);
        const tiddler = options.wiki.getTiddler(domain.categories[0].title);
        expect(tiddler.fields.name).toEqual(params.name);
        expect(tiddler.fields.text).toEqual(params.description);
    });
});
