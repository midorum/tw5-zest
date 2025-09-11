const utils = require("test/utils").zestTestUtils;
const messageHandler = require("$:/plugins/midorum/zest/modules/message-handler.js");
const Logger = $tw.utils.Logger.prototype;

describe("The deleteThesis service", () => {
    var consoleSpy;
    var consoleDebugSpy;
    var loggerSpy;

    beforeEach(function () {
        consoleSpy = spyOn(console, 'log');
        consoleDebugSpy = spyOn(console, 'debug');
        loggerSpy = spyOn(Logger, 'alert');
    });

    it("should be defined", () => {
        expect(messageHandler.deleteThesis).toBeDefined();
    });

    it("should fail when the 'id' argument is not passed", () => {
        const options = utils.setupWiki();
        const params = { id: undefined };
        const expectedMessage = "Thesis id is required";
        expect(messageHandler.deleteThesis(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail when the thesis does not exist", () => {
        const options = utils.setupWiki();
        const params = { id: "$:/zest/db/thesis/nonexistent" };
        const expectedMessage = "Thesis not found";
        expect(messageHandler.deleteThesis(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should not delete the last thesis for the category", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1', categories: [{ name: 'Category1', theses: [{ text: 'Thesis1' }] }] });
        const category = domain.categories[0];
        const thesis = category.theses[0];
        expect(options.wiki.getTiddler(thesis.title)).toBeDefined();
        const params = { id: thesis.title };
        messageHandler.deleteThesis(params, options.widget, options.env);
        // Ожидаем ошибку и что тезис остался
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain("Cannot delete the last thesis for the category");
        const tiddler = options.wiki.getTiddler(thesis.title);
        expect(tiddler).toBeDefined();
    });

    it("should delete the thesis when category has more than one thesis", () => {
        loggerSpy.and.callThrough();
        const options = utils.setupWiki();
        const domain = options.push.domain({
            name: 'Domain1', categories: [{
                name: 'Category1', theses: [
                    { text: 'Thesis1' },
                    { text: 'Thesis2' }
                ]
            }]
        });
        const category = domain.categories[0];
        const thesis1 = category.theses[0];
        const thesis2 = category.theses[1];
        expect(options.wiki.getTiddler(thesis1.title)).toBeDefined();
        expect(options.wiki.getTiddler(thesis2.title)).toBeDefined();
        const params = { id: thesis1.title };
        messageHandler.deleteThesis(params, options.widget, options.env);
        expect(Logger.alert).toHaveBeenCalledTimes(0);
        const tiddler1 = options.wiki.getTiddler(thesis1.title);
        const tiddler2 = options.wiki.getTiddler(thesis2.title);
        expect(tiddler1).toBeUndefined();
        expect(tiddler2).toBeDefined();
    });

});
