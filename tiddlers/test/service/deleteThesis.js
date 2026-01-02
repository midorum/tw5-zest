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

    it("should delete the thesis", () => {
        // loggerSpy.and.callThrough();
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

    it("should delete the thesis and its associated statement tiddlers", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({
            name: 'Domain1', categories: [{
                name: 'Category1', theses: [
                    {
                        text: 'Thesis1',
                        correctStatements: ['Correct statement 1', 'Correct statement 2'],
                        incorrectStatements: ['Incorrect statement 1', 'Incorrect statement 2']
                    },
                    {
                        text: 'Thesis2',
                        correctStatements: ['Thesis2 correct statement 1', 'Thesis2 correct statement 2'],
                        incorrectStatements: ['Thesis2 incorrect statement 1', 'Thesis2 incorrect statement 2']
                    }
                ]
            }]
        });
        const category = domain.categories[0];
        const thesis1 = category.theses[0];
        const thesis2 = category.theses[1];
        expect(options.wiki.getTiddler(thesis1.title)).toBeDefined();
        expect(options.wiki.getTiddler(thesis2.title)).toBeDefined();
        const thesisTiddler1 = options.wiki.getTiddler(thesis1.title);
        const correctStatements1 = thesisTiddler1.fields["correct-statements"];
        const incorrectStatements1 = thesisTiddler1.fields["incorrect-statements"];
        expect(correctStatements1).toBeDefined();
        expect(incorrectStatements1).toBeDefined();
        const correctStatementIds1 = $tw.utils.parseStringArray(correctStatements1);
        const incorrectStatementIds1 = $tw.utils.parseStringArray(incorrectStatements1);
        expect(correctStatementIds1.length).toBe(2);
        expect(incorrectStatementIds1.length).toBe(2);
        const thesisTiddler2 = options.wiki.getTiddler(thesis2.title);
        const correctStatements2 = thesisTiddler2.fields["correct-statements"];
        const incorrectStatements2 = thesisTiddler2.fields["incorrect-statements"];
        expect(correctStatements2).toBeDefined();
        expect(incorrectStatements2).toBeDefined();
        const correctStatementIds2 = $tw.utils.parseStringArray(correctStatements2);
        const incorrectStatementIds2 = $tw.utils.parseStringArray(incorrectStatements2);
        expect(correctStatementIds2.length).toBe(2);
        expect(incorrectStatementIds2.length).toBe(2);
        correctStatementIds1.forEach(id => {
            expect(options.wiki.getTiddler(id)).toBeDefined();
        });
        incorrectStatementIds1.forEach(id => {
            expect(options.wiki.getTiddler(id)).toBeDefined();
        });
        correctStatementIds2.forEach(id => {
            expect(options.wiki.getTiddler(id)).toBeDefined();
        });
        incorrectStatementIds2.forEach(id => {
            expect(options.wiki.getTiddler(id)).toBeDefined();
        });
        const params = { id: thesis1.title };
        messageHandler.deleteThesis(params, options.widget, options.env);
        expect(Logger.alert).toHaveBeenCalledTimes(0);
        const tiddler1 = options.wiki.getTiddler(thesis1.title);
        expect(tiddler1).toBeUndefined();
        correctStatementIds1.forEach(id => {
            expect(options.wiki.getTiddler(id)).toBeUndefined();
        });
        incorrectStatementIds1.forEach(id => {
            expect(options.wiki.getTiddler(id)).toBeUndefined();
        });
        const tiddler2 = options.wiki.getTiddler(thesis2.title);
        expect(tiddler2).toBeDefined();
        correctStatementIds2.forEach(id => {
            expect(options.wiki.getTiddler(id)).toBeDefined();
        });
        incorrectStatementIds2.forEach(id => {
            expect(options.wiki.getTiddler(id)).toBeDefined();
        });
    });

    it("should delete thesis without statements without errors", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({
            name: 'Domain1', categories: [{
                name: 'Category1', theses: [
                    { text: 'Thesis without statements' }
                ]
            }]
        });
        const category = domain.categories[0];
        const thesis = category.theses[0];
        const thesisTiddler = options.wiki.getTiddler(thesis.title);
        expect(thesisTiddler).toBeDefined();
        expect(thesisTiddler.fields["correct-statements"]).toBeUndefined();
        expect(thesisTiddler.fields["incorrect-statements"]).toBeUndefined();
        const params = { id: thesis.title };
        messageHandler.deleteThesis(params, options.widget, options.env);
        expect(Logger.alert).toHaveBeenCalledTimes(0);
        expect(options.wiki.getTiddler(thesis.title)).toBeUndefined();
    });

});
