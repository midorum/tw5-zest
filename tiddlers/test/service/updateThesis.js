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
        const correctStatementsTag = "$:/temp/test/correct";
        const incorrectStatementsTag = "$:/temp/test/incorrect";
        options.push.tempStatements([
            { isCorrect: true, text: "A is true", tag: correctStatementsTag }
        ]);
        const params = {
            id: thesis.title,
            text: "Updated text",
            correctStatementsTag: correctStatementsTag,
            incorrectStatementsTag: incorrectStatementsTag
        };
        const expectedMessage = "Both thesis correct statements and incorrect statements must be provided together";
        expect(messageHandler.updateThesis(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
        // Verify no statement tiddlers were created
        const statementTiddlers = options.wiki.getTiddlersWithTag(options.tags.statement);
        expect(statementTiddlers.length).toBe(0);
    });

    it("should fail if only incorrectStatements is provided", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1', categories: [{ name: 'Category1', theses: [{ text: 'Thesis1' }] }] });
        const thesis = domain.categories[0].theses[0];
        const correctStatementsTag = "$:/temp/test/correct";
        const incorrectStatementsTag = "$:/temp/test/incorrect";
        options.push.tempStatements([
            { isCorrect: false, text: "B is false", tag: incorrectStatementsTag }
        ]);
        const params = {
            id: thesis.title,
            text: "Updated text",
            correctStatementsTag: correctStatementsTag,
            incorrectStatementsTag: incorrectStatementsTag
        };
        const expectedMessage = "Both thesis correct statements and incorrect statements must be provided together";
        expect(messageHandler.updateThesis(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
        // Verify no statement tiddlers were created
        const statementTiddlers = options.wiki.getTiddlersWithTag(options.tags.statement);
        expect(statementTiddlers.length).toBe(0);
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
        const oldCorrectStatementIds = $tw.utils.parseStringArray(options.wiki.getTiddler(thesis.title).fields["correct-statements"]);
        const oldIncorrectStatementIds = $tw.utils.parseStringArray(options.wiki.getTiddler(thesis.title).fields["incorrect-statements"]);
        const correctStatementsTag = "$:/temp/test/correct";
        const incorrectStatementsTag = "$:/temp/test/incorrect";
        options.push.tempStatements([
            { isCorrect: true, text: "C is true", tag: correctStatementsTag },
            { isCorrect: false, text: "D is false", tag: incorrectStatementsTag }
        ]);
        const params = {
            id: thesis.title,
            text: "Updated text",
            correctStatementsTag: correctStatementsTag,
            incorrectStatementsTag: incorrectStatementsTag
        };
        messageHandler.updateThesis(params, options.widget, options.env);
        expect(Logger.alert).toHaveBeenCalledTimes(0);
        oldCorrectStatementIds.forEach(id => {
            expect(options.wiki.getTiddler(id)).toBeUndefined();
        });
        oldIncorrectStatementIds.forEach(id => {
            expect(options.wiki.getTiddler(id)).toBeUndefined();
        });
        const tiddler = options.wiki.getTiddler(thesis.title);
        expect(tiddler.fields["correct-statements"]).toBeDefined();
        expect(tiddler.fields["incorrect-statements"]).toBeDefined();
        const correctStatementIds = $tw.utils.parseStringArray(tiddler.fields["correct-statements"]);
        const incorrectStatementIds = $tw.utils.parseStringArray(tiddler.fields["incorrect-statements"]);
        expect(correctStatementIds.length).toBe(1);
        expect(incorrectStatementIds.length).toBe(1);
        const correctStatementTiddler = options.wiki.getTiddler(correctStatementIds[0]);
        const incorrectStatementTiddler = options.wiki.getTiddler(incorrectStatementIds[0]);
        expect(correctStatementTiddler.fields.text).toBe("C is true");
        expect(incorrectStatementTiddler.fields.text).toBe("D is false");
        expect(correctStatementTiddler.fields.tags).toContain(options.tags.statementCorrect);
        expect(incorrectStatementTiddler.fields.tags).toContain(options.tags.statementIncorrect);
        expect(correctStatementTiddler.fields.tags).toContain(tiddler.fields.title);
        expect(incorrectStatementTiddler.fields.tags).toContain(tiddler.fields.title);
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
        const correctStatementsTag = "$:/temp/test/correct5";
        const incorrectStatementsTag = "$:/temp/test/incorrect5";
        options.push.tempStatements([
            { isCorrect: true, text: "A is true", tag: correctStatementsTag },
            { isCorrect: true, text: "A is true", tag: correctStatementsTag },  // duplicate
            { isCorrect: true, text: "B is true", tag: correctStatementsTag },
            { isCorrect: false, text: "C is false", tag: incorrectStatementsTag },
            { isCorrect: false, text: "C is false", tag: incorrectStatementsTag },  // duplicate
            { isCorrect: false, text: "D is false", tag: incorrectStatementsTag },
            { isCorrect: false, text: "D is false", tag: incorrectStatementsTag }  // duplicate
        ]);
        const params = {
            id: thesis.title,
            text: "Updated text",
            correctStatementsTag: correctStatementsTag,
            incorrectStatementsTag: incorrectStatementsTag
        };
        messageHandler.updateThesis(params, options.widget, options.env);
        const tiddler = options.wiki.getTiddler(thesis.title);
        const correctStatementIds = $tw.utils.parseStringArray(tiddler.fields["correct-statements"]);
        const incorrectStatementIds = $tw.utils.parseStringArray(tiddler.fields["incorrect-statements"]);
        // Should have only 2 correct and 2 incorrect (duplicates merged)
        expect(correctStatementIds.length).toBe(2);
        expect(incorrectStatementIds.length).toBe(2);
        const correctTexts = correctStatementIds.map(id => options.wiki.getTiddler(id).fields.text).sort();
        const incorrectTexts = incorrectStatementIds.map(id => options.wiki.getTiddler(id).fields.text).sort();
        expect(correctTexts).toEqual(["A is true", "B is true"]);
        expect(incorrectTexts).toEqual(["C is false", "D is false"]);
    });

    it("should ignore empty temporary statement tiddlers on update", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({
            name: 'Domain1', categories: [{
                name: 'Category1', theses: [{
                    text: 'Thesis1',
                    correctStatements: ["Old correct"],
                    incorrectStatements: ["Old incorrect"]
                }]
            }]
        });
        const thesis = domain.categories[0].theses[0];
        const correctStatementsTag = "$:/temp/test/correct6";
        const incorrectStatementsTag = "$:/temp/test/incorrect6";
        options.push.tempStatements([
            { isCorrect: true, text: "Valid statement", tag: correctStatementsTag },
            { isCorrect: true, text: "", tag: correctStatementsTag },  // empty
            { isCorrect: true, text: "   ", tag: correctStatementsTag },  // whitespace only
            { isCorrect: false, text: "Another valid", tag: incorrectStatementsTag },
            { isCorrect: false, text: "", tag: incorrectStatementsTag },  // empty
            { isCorrect: false, text: "  \n  ", tag: incorrectStatementsTag }  // whitespace only
        ]);
        const params = {
            id: thesis.title,
            text: "Updated text",
            correctStatementsTag: correctStatementsTag,
            incorrectStatementsTag: incorrectStatementsTag
        };
        messageHandler.updateThesis(params, options.widget, options.env);
        const tiddler = options.wiki.getTiddler(thesis.title);
        const correctStatementIds = $tw.utils.parseStringArray(tiddler.fields["correct-statements"]);
        const incorrectStatementIds = $tw.utils.parseStringArray(tiddler.fields["incorrect-statements"]);
        // Should have only 1 correct and 1 incorrect (empty ones ignored)
        expect(correctStatementIds.length).toBe(1);
        expect(incorrectStatementIds.length).toBe(1);
        expect(options.wiki.getTiddler(correctStatementIds[0]).fields.text).toBe("Valid statement");
        expect(options.wiki.getTiddler(incorrectStatementIds[0]).fields.text).toBe("Another valid");
    });

    it("should remove statement fields if all temporary statements are empty on update", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({
            name: 'Domain1', categories: [{
                name: 'Category1', theses: [{
                    text: 'Thesis1',
                    correctStatements: ["Old correct"],
                    incorrectStatements: ["Old incorrect"]
                }]
            }]
        });
        const thesis = domain.categories[0].theses[0];
        const oldCorrectStatementIds = $tw.utils.parseStringArray(options.wiki.getTiddler(thesis.title).fields["correct-statements"]);
        const oldIncorrectStatementIds = $tw.utils.parseStringArray(options.wiki.getTiddler(thesis.title).fields["incorrect-statements"]);

        const correctStatementsTag = "$:/temp/test/correct7";
        const incorrectStatementsTag = "$:/temp/test/incorrect7";
        options.push.tempStatements([
            { isCorrect: true, text: "", tag: correctStatementsTag },
            { isCorrect: true, text: "  ", tag: correctStatementsTag },
            { isCorrect: false, text: "", tag: incorrectStatementsTag },
            { isCorrect: false, text: "\n\n", tag: incorrectStatementsTag }
        ]);
        const params = {
            id: thesis.title,
            text: "Updated text",
            correctStatementsTag: correctStatementsTag,
            incorrectStatementsTag: incorrectStatementsTag
        };
        messageHandler.updateThesis(params, options.widget, options.env);

        // Verify old statement tiddlers are deleted
        oldCorrectStatementIds.forEach(id => {
            expect(options.wiki.getTiddler(id)).toBeUndefined();
        });
        oldIncorrectStatementIds.forEach(id => {
            expect(options.wiki.getTiddler(id)).toBeUndefined();
        });

        const tiddler = options.wiki.getTiddler(thesis.title);
        // Fields should be undefined since no valid statements were created
        expect(tiddler.fields["correct-statements"]).toBeUndefined();
        expect(tiddler.fields["incorrect-statements"]).toBeUndefined();
    });

    it("should fail if only valid correct statements remain after filtering empty ones on update", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({
            name: 'Domain1', categories: [{
                name: 'Category1', theses: [{
                    text: 'Thesis1',
                    correctStatements: ["Old correct"],
                    incorrectStatements: ["Old incorrect"]
                }]
            }]
        });
        const thesis = domain.categories[0].theses[0];
        // Get old statement IDs before update attempt
        const oldCorrectStatementIds = $tw.utils.parseStringArray(options.wiki.getTiddler(thesis.title).fields["correct-statements"]);
        const oldIncorrectStatementIds = $tw.utils.parseStringArray(options.wiki.getTiddler(thesis.title).fields["incorrect-statements"]);
        const oldStatementIds = [...oldCorrectStatementIds, ...oldIncorrectStatementIds];

        const correctStatementsTag = "$:/temp/test/correct8";
        const incorrectStatementsTag = "$:/temp/test/incorrect8";
        options.push.tempStatements([
            { isCorrect: true, text: "Valid statement", tag: correctStatementsTag },
            { isCorrect: false, text: "", tag: incorrectStatementsTag },  // all incorrect are empty
            { isCorrect: false, text: "  ", tag: incorrectStatementsTag }
        ]);
        const params = {
            id: thesis.title,
            text: "Updated text",
            correctStatementsTag: correctStatementsTag,
            incorrectStatementsTag: incorrectStatementsTag
        };
        messageHandler.updateThesis(params, options.widget, options.env);
        expect(loggerSpy).toHaveBeenCalledTimes(1);
        const results = loggerSpy.calls.first().args;
        expect(results[0]).toContain("Both thesis correct statements and incorrect statements must be provided together");
        // Verify only old statement tiddlers exist (no new ones created)
        const allStatements = options.wiki.getTiddlersWithTag(options.tags.statement);
        expect(allStatements.length).toBe(oldStatementIds.length);
        allStatements.forEach(id => {
            expect(oldStatementIds).toContain(id);
        });
    });

    it("should fail if only valid incorrect statements remain after filtering empty ones on update", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({
            name: 'Domain1', categories: [{
                name: 'Category1', theses: [{
                    text: 'Thesis1',
                    correctStatements: ["Old correct"],
                    incorrectStatements: ["Old incorrect"]
                }]
            }]
        });
        const thesis = domain.categories[0].theses[0];
        // Get old statement IDs before update attempt
        const oldCorrectStatementIds = $tw.utils.parseStringArray(options.wiki.getTiddler(thesis.title).fields["correct-statements"]);
        const oldIncorrectStatementIds = $tw.utils.parseStringArray(options.wiki.getTiddler(thesis.title).fields["incorrect-statements"]);
        const oldStatementIds = [...oldCorrectStatementIds, ...oldIncorrectStatementIds];

        const correctStatementsTag = "$:/temp/test/correct9";
        const incorrectStatementsTag = "$:/temp/test/incorrect9";
        options.push.tempStatements([
            { isCorrect: true, text: "", tag: correctStatementsTag },  // all correct are empty
            { isCorrect: true, text: "  \n  ", tag: correctStatementsTag },
            { isCorrect: false, text: "Valid incorrect", tag: incorrectStatementsTag }
        ]);
        const params = {
            id: thesis.title,
            text: "Updated text",
            correctStatementsTag: correctStatementsTag,
            incorrectStatementsTag: incorrectStatementsTag
        };
        messageHandler.updateThesis(params, options.widget, options.env);
        expect(loggerSpy).toHaveBeenCalledTimes(1);
        const results = loggerSpy.calls.first().args;
        expect(results[0]).toContain("Both thesis correct statements and incorrect statements must be provided together");
        // Verify only old statement tiddlers exist (no new ones created)
        const allStatements = options.wiki.getTiddlersWithTag(options.tags.statement);
        expect(allStatements.length).toBe(oldStatementIds.length);
        allStatements.forEach(id => {
            expect(oldStatementIds).toContain(id);
        });
    });
});
