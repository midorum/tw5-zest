const utils = require("test/utils").zestTestUtils;
const messageHandler = require("$:/plugins/midorum/zest/modules/message-handler.js");
const Logger = $tw.utils.Logger.prototype;

describe("The detachCategory service", () => {
    var consoleSpy;
    var consoleDebugSpy;
    var loggerSpy;

    beforeEach(function () {
        consoleSpy = spyOn(console, 'log');
        consoleDebugSpy = spyOn(console, 'debug');
        loggerSpy = spyOn(Logger, 'alert');
    });

    it("should be defined", () => {
        expect(messageHandler.detachCategory).toBeDefined();
    });

    it("should fail when the 'categoryId' argument is not passed", () => {
        const options = utils.setupWiki();
        const params = { categoryId: undefined, domainId: "$:/zest/db/domain/1" };
        const expectedMessage = "Category id is required";
        expect(messageHandler.detachCategory(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail when the 'domainId' argument is not passed", () => {
        const options = utils.setupWiki();
        const params = { categoryId: "$:/zest/db/category/1", domainId: undefined };
        const expectedMessage = "Domain id is required";
        expect(messageHandler.detachCategory(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail when the category does not exist", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1' });
        const params = { categoryId: "$:/zest/db/category/nonexistent", domainId: domain.domain.title };
        const expectedMessage = "Category not found";
        expect(messageHandler.detachCategory(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail when the domain does not exist", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1', categories: [{ name: 'Category1', theses: [{ text: 'Thesis' }] }] });
        const params = { categoryId: domain.categories[0].title, domainId: "$:/zest/db/domain/nonexistent" };
        const expectedMessage = "Domain not found";
        expect(messageHandler.detachCategory(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail when the domain is only one linked to the category", () => {
        // consoleDebugSpy.and.callThrough();
        // loggerSpy.and.callThrough();
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1', categories: [{ name: 'Category1', theses: [{ text: 'Thesis' }] }] });
        const categoryId = domain.categories[0].title;
        const params = { categoryId: categoryId, domainId: domain.domain.title };
        const expectedMessage = "Cannot detach: category must be linked to at least one domain";
        let tiddler = options.wiki.getTiddler(categoryId);
        expect(tiddler.fields.tags).toContain(domain.domain.title);
        messageHandler.detachCategory(params, options.widget, options.env);
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should detach the domain from the category if more than one domain is linked", () => {
        // consoleDebugSpy.and.callThrough();
        loggerSpy.and.callThrough();
        const options = utils.setupWiki();
        const domain1 = options.push.domain({ name: 'Domain1' });
        const domain2 = options.push.domain({ name: 'Domain2', categories: [{ name: 'Category1', theses: [{ text: 'Thesis' }] }] });
        const categoryId = domain2.categories[0].title;
        // attach category to domain1
        messageHandler.attachCategory({ categoryId: categoryId, domainId: domain1.domain.title }, options.widget, options.env);
        const params = { categoryId: categoryId, domainId: domain1.domain.title };
        let tiddler = options.wiki.getTiddler(categoryId);
        console.debug("before", tiddler);
        expect(tiddler.fields.tags).toContain(domain1.domain.title);
        expect(tiddler.fields.tags).toContain(domain2.domain.title);
        messageHandler.detachCategory(params, options.widget, options.env);
        expect(Logger.alert).toHaveBeenCalledTimes(0);
        tiddler = options.wiki.getTiddler(categoryId);
        console.debug("after", tiddler);
        expect(tiddler.fields.tags).not.toContain(domain1.domain.title);
        expect(tiddler.fields.tags).toContain(domain2.domain.title);
    });
});
