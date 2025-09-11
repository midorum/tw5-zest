const utils = require("test/utils").zestTestUtils;
const messageHandler = require("$:/plugins/midorum/zest/modules/message-handler.js");
const Logger = $tw.utils.Logger.prototype;

describe("The updateThesis service", () => {
    var consoleSpy;
    var consoleDebugSpy;
    var loggerSpy;

    beforeEach(function () {
        consoleSpy = spyOn(console, 'log');
        consoleDebugSpy = spyOn(console, 'debug');
        loggerSpy = spyOn(Logger, 'alert');
    });

    it("should be defined", () => {
        expect(messageHandler.updateThesis).toBeDefined();
    });

    it("should fail when the 'id' argument is not passed", () => {
        const options = utils.setupWiki();
        const params = { id: undefined, text: "New text" };
        const expectedMessage = "Thesis id is required";
        expect(messageHandler.updateThesis(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail when the thesis does not exist", () => {
        const options = utils.setupWiki();
        const params = { id: "$:/zest/db/thesis/nonexistent", text: "New text" };
        const expectedMessage = "Thesis not found";
        expect(messageHandler.updateThesis(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail when the 'text' argument is not passed", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1', categories: [{ name: 'Category1', theses: [{ text: 'Thesis1' }] }] });
        const category = domain.categories[0];
        const thesis = category.theses[0];
        const params = { id: thesis.title, text: undefined, note: "Updated note" };
        const expectedMessage = "Thesis text cannot be empty";
        expect(messageHandler.updateThesis(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should update the thesis when all parameters are valid", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1', categories: [{ name: 'Category1', theses: [{ text: 'Thesis1', note: 'Note1' }] }] });
        const category = domain.categories[0];
        const thesis = category.theses[0];
        const params = { id: thesis.title, text: "Updated text", note: "Updated note" };
        messageHandler.updateThesis(params, options.widget, options.env);
        expect(Logger.alert).toHaveBeenCalledTimes(0);
        const tiddler = options.wiki.getTiddler(thesis.title);
        expect(tiddler.fields.text).toEqual(params.text);
        expect(tiddler.fields.note).toEqual(params.note);
    });

    it("should remove the thesis note if the 'note' parameter is not passed", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1', categories: [{ name: 'Category1', theses: [{ text: 'Thesis1', note: 'Note1' }] }] });
        const category = domain.categories[0];
        const thesis = category.theses[0];
        expect(options.wiki.getTiddler(thesis.title).fields.note).toBe(thesis.note);
        const params = { id: thesis.title, text: "Updated text" };
        messageHandler.updateThesis(params, options.widget, options.env);
        const tiddler = options.wiki.getTiddler(thesis.title);
        expect(tiddler.fields.text).toEqual(params.text);
        expect(tiddler.fields.note).toBeUndefined();
    });
});
