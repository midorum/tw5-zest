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

    it("should fail if only correctStatements is provided", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1', categories: [{ name: 'Category1', theses: [{ text: 'Thesis1' }] }] });
        const thesis = domain.categories[0].theses[0];
        const params = {
            id: thesis.title,
            text: "Updated text",
            correctStatements: "[[A is true]]",
        };
        const expectedMessage = "Both thesis correct statements and incorrect statements must be provided together";
        expect(messageHandler.updateThesis(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail if only incorrectStatements is provided", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1', categories: [{ name: 'Category1', theses: [{ text: 'Thesis1' }] }] });
        const thesis = domain.categories[0].theses[0];
        const params = {
            id: thesis.title,
            text: "Updated text",
            incorrectStatements: "[[B is false]]"
        };
        const expectedMessage = "Both thesis correct statements and incorrect statements must be provided together";
        expect(messageHandler.updateThesis(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail if the correctStatements is an empty array", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1', categories: [{ name: 'Category1', theses: [{ text: 'Thesis1' }] }] });
        const thesis = domain.categories[0].theses[0];
        const params = {
            id: thesis.title,
            text: "Updated text",
            correctStatements: "[[]]",
            incorrectStatements: "[[B is false]]"
        };
        const expectedMessage = "Both thesis correct statements and incorrect statements must be non-empty arrays";
        expect(messageHandler.updateThesis(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail if the incorrectStatements is an empty array", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1', categories: [{ name: 'Category1', theses: [{ text: 'Thesis1' }] }] });
        const thesis = domain.categories[0].theses[0];
        const params = {
            id: thesis.title,
            text: "Updated text",
            correctStatements: "[[A is true]]",
            incorrectStatements: "[[]]"
        };
        const expectedMessage = "Both thesis correct statements and incorrect statements must be non-empty arrays";
        expect(messageHandler.updateThesis(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should update thesis with correct and incorrect statements when both are provided and non-empty", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({
            name: 'Domain1', categories: [{
                name: 'Category1', theses: [{
                    text: 'Thesis1',
                    correctStatements: ["A is true"],
                    incorrectStatements: ["B is false"]
                }]
            }]
        });
        const thesis = domain.categories[0].theses[0];
        const params = {
            id: thesis.title,
            text: "Updated text",
            correctStatements: "[[C is true]]",
            incorrectStatements: "[[D is false]]"
        };
        messageHandler.updateThesis(params, options.widget, options.env);
        expect(Logger.alert).toHaveBeenCalledTimes(0);
        const tiddler = options.wiki.getTiddler(thesis.title);
        expect(tiddler.fields["correct-statements"]).toEqual(params.correctStatements);
        expect(tiddler.fields["incorrect-statements"]).toEqual(params.incorrectStatements);
    });

    it("should remove correct and incorrect statements if both parameters are undefined", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({
            name: 'Domain1', categories: [{
                name: 'Category1', theses: [{
                    text: 'Thesis1',
                    correctStatements: ["A is true"],
                    incorrectStatements: ["B is false"]
                }]
            }]
        });
        const thesis = domain.categories[0].theses[0];
        // Ensure fields exist before update
        expect(options.wiki.getTiddler(thesis.title).fields["correct-statements"]).toBeDefined();
        expect(options.wiki.getTiddler(thesis.title).fields["incorrect-statements"]).toBeDefined();
        const params = {
            id: thesis.title,
            text: "Updated text"
        };
        messageHandler.updateThesis(params, options.widget, options.env);
        const tiddler = options.wiki.getTiddler(thesis.title);
        expect(tiddler.fields["correct-statements"]).toBeUndefined();
        expect(tiddler.fields["incorrect-statements"]).toBeUndefined();
    });

    it("should merge duplicate statements in both correct and incorrect lists on update", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({
            name: 'Domain1', categories: [{
                name: 'Category1', theses: [{
                    text: 'Thesis1',
                    correctStatements: ["A is true"],
                    incorrectStatements: ["B is false"]
                }]
            }]
        });
        const thesis = domain.categories[0].theses[0];
        const params = {
            id: thesis.title,
            text: "Updated text",
            correctStatements: "[[A is true]] [[A is true]] [[B is true]]",
            incorrectStatements: "[[C is false]] [[C is false]] [[D is false]] [[D is false]]"
        };
        messageHandler.updateThesis(params, options.widget, options.env);
        const tiddler = options.wiki.getTiddler(thesis.title);
        expect(tiddler.fields["correct-statements"]).toEqual("[[A is true]] [[B is true]]");
        expect(tiddler.fields["incorrect-statements"]).toEqual("[[C is false]] [[D is false]]");
    });
});
