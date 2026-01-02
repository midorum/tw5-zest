const utils = require("test/utils").zestTestUtils;
const messageHandler = require("$:/plugins/midorum/zest/modules/message-handler.js");
const Logger = $tw.utils.Logger.prototype;

describe("The createThesis service", () => {
    var consoleSpy;
    var consoleDebugSpy;
    var loggerSpy;

    beforeEach(function () {
        consoleSpy = spyOn(console, 'log');
        consoleDebugSpy = spyOn(console, 'debug');
        loggerSpy = spyOn(Logger, 'alert');
    });

    it("should be defined", () => {
        expect(messageHandler.createThesis).toBeDefined();
    });

    it("should fail when the 'text' argument is not passed", () => {
        const options = utils.setupWiki();
        const params = { text: undefined, categoryId: "$:/zest/db/category/1" };
        const expectedMessage = "Thesis text cannot be empty";
        expect(messageHandler.createThesis(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail when the 'categoryId' argument is not passed", () => {
        const options = utils.setupWiki();
        const params = { text: "Some thesis", categoryId: undefined };
        const expectedMessage = "Category id is required";
        expect(messageHandler.createThesis(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should create a thesis tiddler with correct fields and tags", () => {
        // consoleDebugSpy.and.callThrough();
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1', categories: [{ name: 'Category1', theses: [{ text: 'Thesis1' }] }] });
        const categoryId = domain.categories[0].title;
        const params = { text: "New thesis", note: "Some note", categoryId: categoryId };
        messageHandler.createThesis(params, options.widget, options.env);
        console.debug("domains", options.wiki.filterTiddlers(`[tag[${options.tags.domain}]]`));
        console.debug("categories", options.wiki.filterTiddlers(`[tag[${options.tags.category}]]`));
        console.debug("theses", options.wiki.filterTiddlers(`[tag[${options.tags.thesis}]]`));
        const thesisTag = options.tags.thesis;
        const allTheses = options.wiki.getTiddlersWithTag(thesisTag);
        expect(allTheses.length).toEqual(2);
        const thesisTiddler = allTheses.map(t => options.wiki.getTiddler(t)).filter(t => t.fields.text === params.text).at(0);
        expect(thesisTiddler).toBeDefined();
        console.debug(thesisTiddler);
        expect(thesisTiddler.fields.text).toBe(params.text);
        expect(thesisTiddler.fields.note).toBe(params.note);
        expect(thesisTiddler.fields.tags).toContain(thesisTag);
        expect(thesisTiddler.fields.tags).toContain(categoryId);
        expect(thesisTiddler.fields.tags).toContain("$:/srs/tags/scheduledForward");
    });

    it("should fail if only correctStatements is provided", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1', categories: [{ name: 'Category1', theses: [{ text: 'Thesis1' }] }] });
        const categoryId = domain.categories[0].title;
        const correctStatementsTag = "$:/temp/test/correct";
        const incorrectStatementsTag = "$:/temp/test/incorrect";
        options.push.tempStatements([
            { isCorrect: true, text: "A is true", tag: correctStatementsTag }
        ]);
        const params = {
            text: "Thesis with only correct",
            categoryId: categoryId,
            correctStatementsTag: correctStatementsTag,
            incorrectStatementsTag: incorrectStatementsTag
        };
        const expectedMessage = "Both thesis correct statements and incorrect statements must be provided together";
        expect(messageHandler.createThesis(params, options.widget, options.env)).nothing();
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
        const categoryId = domain.categories[0].title;
        const correctStatementsTag = "$:/temp/test/correct2";
        const incorrectStatementsTag = "$:/temp/test/incorrect2";
        options.push.tempStatements([
            { isCorrect: false, text: "B is false", tag: incorrectStatementsTag }
        ]);
        const params = {
            text: "Thesis with only incorrect",
            categoryId: categoryId,
            correctStatementsTag: correctStatementsTag,
            incorrectStatementsTag: incorrectStatementsTag
        };
        const expectedMessage = "Both thesis correct statements and incorrect statements must be provided together";
        expect(messageHandler.createThesis(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
        // Verify no statement tiddlers were created
        const statementTiddlers = options.wiki.getTiddlersWithTag(options.tags.statement);
        expect(statementTiddlers.length).toBe(0);
    });

    it("should create thesis with correct and incorrect statements when both are provided and non-empty", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1', categories: [{ name: 'Category1', theses: [{ text: 'Thesis1' }] }] });
        const categoryId = domain.categories[0].title;
        const correctStatementsTag = "$:/temp/test/correct3";
        const incorrectStatementsTag = "$:/temp/test/incorrect3";
        options.push.tempStatements([
            { isCorrect: true, text: "A is true", tag: correctStatementsTag },
            { isCorrect: false, text: "B is false", tag: incorrectStatementsTag }
        ]);
        const params = {
            text: "Thesis with statements",
            categoryId: categoryId,
            correctStatementsTag: correctStatementsTag,
            incorrectStatementsTag: incorrectStatementsTag
        };
        messageHandler.createThesis(params, options.widget, options.env);
        const thesisTag = options.tags.thesis;
        const allTheses = options.wiki.getTiddlersWithTag(thesisTag);
        const thesisTiddler = allTheses.map(t => options.wiki.getTiddler(t)).filter(t => t.fields.text === params.text).at(0);
        expect(thesisTiddler.fields["correct-statements"]).toBeDefined();
        expect(thesisTiddler.fields["incorrect-statements"]).toBeDefined();
        const correctStatementIds = $tw.utils.parseStringArray(thesisTiddler.fields["correct-statements"]);
        const incorrectStatementIds = $tw.utils.parseStringArray(thesisTiddler.fields["incorrect-statements"]);
        expect(correctStatementIds.length).toBe(1);
        expect(incorrectStatementIds.length).toBe(1);
        const correctStatementTiddler = options.wiki.getTiddler(correctStatementIds[0]);
        const incorrectStatementTiddler = options.wiki.getTiddler(incorrectStatementIds[0]);
        expect(correctStatementTiddler.fields.text).toBe("A is true");
        expect(incorrectStatementTiddler.fields.text).toBe("B is false");
        expect(correctStatementTiddler.fields.tags).toContain(options.tags.statementCorrect);
        expect(incorrectStatementTiddler.fields.tags).toContain(options.tags.statementIncorrect);
        expect(correctStatementTiddler.fields.tags).toContain(thesisTiddler.fields.title);
        expect(incorrectStatementTiddler.fields.tags).toContain(thesisTiddler.fields.title);
    });

    it("should merge duplicate statements in both correct and incorrect lists", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1', categories: [{ name: 'Category1', theses: [{ text: 'Thesis1' }] }] });
        const categoryId = domain.categories[0].title;
        const correctStatementsTag = "$:/temp/test/correct4";
        const incorrectStatementsTag = "$:/temp/test/incorrect4";
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
            text: "Thesis with duplicate both",
            categoryId: categoryId,
            correctStatementsTag: correctStatementsTag,
            incorrectStatementsTag: incorrectStatementsTag
        };
        messageHandler.createThesis(params, options.widget, options.env);
        const thesisTag = options.tags.thesis;
        const allTheses = options.wiki.getTiddlersWithTag(thesisTag);
        const thesisTiddler = allTheses.map(t => options.wiki.getTiddler(t)).filter(t => t.fields.text === params.text).at(0);
        const correctStatementIds = $tw.utils.parseStringArray(thesisTiddler.fields["correct-statements"]);
        const incorrectStatementIds = $tw.utils.parseStringArray(thesisTiddler.fields["incorrect-statements"]);
        // Should have only 2 correct and 2 incorrect (duplicates merged)
        expect(correctStatementIds.length).toBe(2);
        expect(incorrectStatementIds.length).toBe(2);
        const correctTexts = correctStatementIds.map(id => options.wiki.getTiddler(id).fields.text).sort();
        const incorrectTexts = incorrectStatementIds.map(id => options.wiki.getTiddler(id).fields.text).sort();
        expect(correctTexts).toEqual(["A is true", "B is true"]);
        expect(incorrectTexts).toEqual(["C is false", "D is false"]);
    });

    it("should ignore empty temporary statement tiddlers", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({
            name: 'Domain1', categories: [{
                name: 'Category1'
            }]
        });
        const categoryId = domain.categories[0].title;
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
            text: "Thesis with empty statements",
            categoryId: categoryId,
            correctStatementsTag: correctStatementsTag,
            incorrectStatementsTag: incorrectStatementsTag
        };
        messageHandler.createThesis(params, options.widget, options.env);
        const thesisTag = options.tags.thesis;
        const allTheses = options.wiki.getTiddlersWithTag(thesisTag);
        const thesisTiddler = allTheses.map(t => options.wiki.getTiddler(t)).filter(t => t.fields.text === params.text).at(0);
        const correctStatementIds = $tw.utils.parseStringArray(thesisTiddler.fields["correct-statements"]);
        const incorrectStatementIds = $tw.utils.parseStringArray(thesisTiddler.fields["incorrect-statements"]);
        // Should have only 1 correct and 1 incorrect (empty ones ignored)
        expect(correctStatementIds.length).toBe(1);
        expect(incorrectStatementIds.length).toBe(1);
        expect(options.wiki.getTiddler(correctStatementIds[0]).fields.text).toBe("Valid statement");
        expect(options.wiki.getTiddler(incorrectStatementIds[0]).fields.text).toBe("Another valid");
    });

    it("should create thesis without statement fields if all temporary statements are empty", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({
            name: 'Domain1', categories: [{
                name: 'Category1'
            }]
        });
        const categoryId = domain.categories[0].title;
        const correctStatementsTag = "$:/temp/test/correct7";
        const incorrectStatementsTag = "$:/temp/test/incorrect7";
        options.push.tempStatements([
            { isCorrect: true, text: "", tag: correctStatementsTag },
            { isCorrect: true, text: "  ", tag: correctStatementsTag },
            { isCorrect: false, text: "", tag: incorrectStatementsTag },
            { isCorrect: false, text: "\n\n", tag: incorrectStatementsTag }
        ]);
        const params = {
            text: "Thesis with all empty statements",
            categoryId: categoryId,
            correctStatementsTag: correctStatementsTag,
            incorrectStatementsTag: incorrectStatementsTag
        };
        messageHandler.createThesis(params, options.widget, options.env);
        const thesisTag = options.tags.thesis;
        const allTheses = options.wiki.getTiddlersWithTag(thesisTag);
        const thesisTiddler = allTheses.map(t => options.wiki.getTiddler(t)).filter(t => t.fields.text === params.text).at(0);
        // Fields should be undefined since no valid statements were created
        expect(thesisTiddler.fields["correct-statements"]).toBeUndefined();
        expect(thesisTiddler.fields["incorrect-statements"]).toBeUndefined();
    });

    it("should fail if only valid correct statements remain after filtering empty ones", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({
            name: 'Domain1', categories: [{
                name: 'Category1'
            }]
        });
        const categoryId = domain.categories[0].title;
        const correctStatementsTag = "$:/temp/test/correct8";
        const incorrectStatementsTag = "$:/temp/test/incorrect8";
        options.push.tempStatements([
            { isCorrect: true, text: "Valid statement", tag: correctStatementsTag },
            { isCorrect: false, text: "", tag: incorrectStatementsTag },  // all incorrect are empty
            { isCorrect: false, text: "  ", tag: incorrectStatementsTag }
        ]);
        const params = {
            text: "Thesis with valid correct only",
            categoryId: categoryId,
            correctStatementsTag: correctStatementsTag,
            incorrectStatementsTag: incorrectStatementsTag
        };
        messageHandler.createThesis(params, options.widget, options.env);
        expect(loggerSpy).toHaveBeenCalledTimes(1);
        const results = loggerSpy.calls.first().args;
        expect(results[0]).toContain("Both thesis correct statements and incorrect statements must be provided together");
        // Verify no statement tiddlers were created (they should be deleted after error)
        const statementTiddlers = options.wiki.getTiddlersWithTag(options.tags.statement);
        expect(statementTiddlers.length).toBe(0);
    });

    it("should fail if only valid incorrect statements remain after filtering empty ones", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({
            name: 'Domain1', categories: [{
                name: 'Category1'
            }]
        });
        const categoryId = domain.categories[0].title;
        const correctStatementsTag = "$:/temp/test/correct9";
        const incorrectStatementsTag = "$:/temp/test/incorrect9";
        options.push.tempStatements([
            { isCorrect: true, text: "", tag: correctStatementsTag },  // all correct are empty
            { isCorrect: true, text: "  \n  ", tag: correctStatementsTag },
            { isCorrect: false, text: "Valid incorrect", tag: incorrectStatementsTag }
        ]);
        const params = {
            text: "Thesis with valid incorrect only",
            categoryId: categoryId,
            correctStatementsTag: correctStatementsTag,
            incorrectStatementsTag: incorrectStatementsTag
        };
        messageHandler.createThesis(params, options.widget, options.env);
        expect(loggerSpy).toHaveBeenCalledTimes(1);
        const results = loggerSpy.calls.first().args;
        expect(results[0]).toContain("Both thesis correct statements and incorrect statements must be provided together");
        // Verify no statement tiddlers were created (they should be deleted after error)
        const statementTiddlers = options.wiki.getTiddlersWithTag(options.tags.statement);
        expect(statementTiddlers.length).toBe(0);
    });
});
