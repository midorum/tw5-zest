const utils = require("test/utils").zestTestUtils;
const messageHandler = require("$:/plugins/midorum/zest/modules/message-handler.js");
const Logger = $tw.utils.Logger.prototype;

describe("The attachCategory service", () => {
    var consoleSpy;
    var consoleDebugSpy;
    var loggerSpy;

    beforeEach(function () {
        consoleSpy = spyOn(console, 'log');
        consoleDebugSpy = spyOn(console, 'debug');
        loggerSpy = spyOn(Logger, 'alert');
    });

    it("should be defined", () => {
        expect(messageHandler.attachCategory).toBeDefined();
    });

    it("should fail when the 'categoryId' argument is not passed", () => {
        const options = utils.setupWiki();
        const params = { categoryId: undefined, domainId: "$:/zest/db/domain/1" };
        const expectedMessage = "Category id is required";
        expect(messageHandler.attachCategory(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail when the 'domainId' argument is not passed", () => {
        const options = utils.setupWiki();
        const params = { categoryId: "$:/zest/db/category/1", domainId: undefined };
        const expectedMessage = "Domain id is required";
        expect(messageHandler.attachCategory(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail when the category does not exist", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1' });
        const params = { categoryId: "$:/zest/db/category/nonexistent", domainId: domain.domain.title };
        const expectedMessage = "Category not found";
        expect(messageHandler.attachCategory(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail when the domain does not exist", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1', categories: [{ name: 'Category1', theses: [{ text: 'Thesis' }] }] });
        const params = { categoryId: domain.categories[0].title, domainId: "$:/zest/db/domain/nonexistent" };
        const expectedMessage = "Domain not found";
        expect(messageHandler.attachCategory(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should attach the category to the domain when all parameters are valid", () => {
        const options = utils.setupWiki();
        const domain1 = options.push.domain({ name: 'Domain1' });
        const domain2 = options.push.domain({ name: 'Domain2', categories: [{ name: 'Category1', theses: [{ text: 'Thesis' }] }] });
        const params = { categoryId: domain2.categories[0].title, domainId: domain1.domain.title };
        messageHandler.attachCategory(params, options.widget, options.env);
        expect(Logger.alert).toHaveBeenCalledTimes(0);
        const tiddler = options.wiki.getTiddler(domain2.categories[0].title);
        expect(tiddler.fields.tags).toContain(domain1.domain.title);
        expect(tiddler.fields.tags).toContain(domain2.domain.title);
    });
});
