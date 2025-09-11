const utils = require("test/utils").zestTestUtils;
const messageHandler = require("$:/plugins/midorum/zest/modules/message-handler.js");
const Logger = $tw.utils.Logger.prototype;

describe("The deleteDomain service", () => {
    var consoleSpy;
    var consoleDebugSpy;
    var loggerSpy;

    beforeEach(function () {
        consoleSpy = spyOn(console, 'log');
        consoleDebugSpy = spyOn(console, 'debug');
        loggerSpy = spyOn(Logger, 'alert');
    });

    it("should be defined", () => {
        expect(messageHandler.deleteDomain).toBeDefined();
    });

    it("should fail when the 'id' argument is not passed", () => {
        const options = utils.setupWiki();
        const params = { id: undefined };
        const expectedMessage = "Domain id is required";
        expect(messageHandler.deleteDomain(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail when the domain does not exist", () => {
        const options = utils.setupWiki();
        const params = { id: "$:/zest/db/domain/nonexistent" };
        const expectedMessage = "Domain not found";
        expect(messageHandler.deleteDomain(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should not delete the domain if it has a linked category", () => {
        // consoleDebugSpy.and.callThrough();
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'domainWithCategory', categories: [{ name: 'cat1', theses: [{ text: 'thesis1' }] }] });
        console.debug("domains", options.wiki.filterTiddlers(`[tag[${options.tags.domain}]]`));
        console.debug("categories", options.wiki.filterTiddlers(`[tag[${options.tags.category}]]`));
        const params = { id: domain.domain.title };
        messageHandler.deleteDomain(params, options.widget, options.env);
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain("Cannot delete domain: categories are still linked to this domain");
        const tiddler = options.wiki.getTiddler(domain.domain.title);
        expect(tiddler).toBeDefined();
    });

    it("should delete the domain when id is valid", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'domainToDelete' });
        const params = { id: domain.domain.title };
        messageHandler.deleteDomain(params, options.widget, options.env);
        expect(Logger.alert).toHaveBeenCalledTimes(0);
        const tiddler = options.wiki.getTiddler(domain.domain.title);
        expect(tiddler).toBeUndefined();
    });

});
