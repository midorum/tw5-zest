const utils = require("test/utils").zestTestUtils;
const messageHandler = require("$:/plugins/midorum/zest/modules/message-handler.js");
const Logger = $tw.utils.Logger.prototype;

describe("The createCategory service", () => {
    var consoleSpy;
    var consoleDebugSpy;
    var loggerSpy;

    beforeEach(function () {
        consoleSpy = spyOn(console, 'log');
        consoleDebugSpy = spyOn(console, 'debug');
        loggerSpy = spyOn(Logger, 'alert');
    });

    it("should be defined", () => {
        expect(messageHandler.createCategory).toBeDefined();
    });

    it("should fail when the 'name' argument is not passed", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain' });
        const params = { name: undefined, thesisText: undefined, domainId: domain.domain.title };
        const expectedMessage = "name cannot be empty";
        expect(messageHandler.createCategory(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail when the 'name' argument is an empty string", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain' });
        const params = { name: "", thesisText: undefined, domainId: domain.domain.title };
        const expectedMessage = "name cannot be empty";
        expect(messageHandler.createCategory(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should create a category tiddler with correct fields when unique name is provided", () => {
        // consoleDebugSpy.and.callThrough();
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain' });
        const params = {
            name: "UniqueCategory",
            description: "UniqueCategory Description",
            domainId: domain.domain.title,
            thesisText: undefined,
            thesisNote: undefined
        };
        messageHandler.createCategory(params, options.widget, options.env);
        console.debug("domains", options.wiki.filterTiddlers(`[tag[${options.tags.domain}]]`));
        console.debug("categories", options.wiki.filterTiddlers(`[tag[${options.tags.category}]]`));
        console.debug("theses", options.wiki.filterTiddlers(`[tag[${options.tags.thesis}]]`));
        const categoryTag = options.tags.category;
        const allCategories = options.wiki.getTiddlersWithTag(categoryTag);
        expect(allCategories.length).toBe(1);
        const categoryTiddler = options.wiki.getTiddler(allCategories[0]);
        expect(categoryTiddler.fields.name).toBe(params.name);
        expect(categoryTiddler.fields.text).toBe(params.description);
        expect(categoryTiddler.fields.tags).toContain(categoryTag);
        expect(categoryTiddler.fields.tags).toContain(domain.domain.title);
        const thesisTag = options.tags.thesis;
        const allTheses = options.wiki.getTiddlersWithTag(thesisTag);
        expect(allTheses.length).toBe(0);
    });

    it("should fail when thesis note is provided without thesis text", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain' });
        const params = {
            name: "CategoryName",
            domainId: domain.domain.title,
            thesisText: undefined,
            thesisNote: "Thesis note"
        };
        const expectedMessage = "thesis text cannot be empty";
        expect(messageHandler.createCategory(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail if thesis statements are provided without thesis text", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain' });
        const correctStatementsTag = "$:/temp/test/correct1";
        const incorrectStatementsTag = "$:/temp/test/incorrect1";
        options.push.tempStatements([
            { isCorrect: true, text: "A is true", tag: correctStatementsTag },
            { isCorrect: false, text: "B is false", tag: incorrectStatementsTag }
        ]);
        const params = {
            name: "CategoryName",
            domainId: domain.domain.title,
            thesisText: undefined,
            correctStatementsTag: correctStatementsTag,
            incorrectStatementsTag: incorrectStatementsTag
        };
        const expectedMessage = "thesis text cannot be empty";
        expect(messageHandler.createCategory(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail if only thesis correctStatements is provided", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain' });
        const correctStatementsTag = "$:/temp/test/correct2";
        const incorrectStatementsTag = "$:/temp/test/incorrect2";
        options.push.tempStatements([
            { isCorrect: true, text: "A is true", tag: correctStatementsTag }
        ]);
        const params = {
            name: "CategoryName",
            domainId: domain.domain.title,
            thesisText: "Thesis text",
            correctStatementsTag: correctStatementsTag,
            incorrectStatementsTag: incorrectStatementsTag
        };
        const expectedMessage = "Both thesis correct statements and incorrect statements must be provided together";
        expect(messageHandler.createCategory(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail if only thesis incorrectStatements is provided", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain' });
        const correctStatementsTag = "$:/temp/test/correct3";
        const incorrectStatementsTag = "$:/temp/test/incorrect3";
        options.push.tempStatements([
            { isCorrect: false, text: "B is false", tag: incorrectStatementsTag }
        ]);
        const params = {
            name: "CategoryName",
            domainId: domain.domain.title,
            thesisText: "Thesis text",
            correctStatementsTag: correctStatementsTag,
            incorrectStatementsTag: incorrectStatementsTag
        };
        const expectedMessage = "Both thesis correct statements and incorrect statements must be provided together";
        expect(messageHandler.createCategory(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail if the correctStatements contains only empty texts", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain' });
        const correctStatementsTag = "$:/temp/test/correct4";
        const incorrectStatementsTag = "$:/temp/test/incorrect4";
        options.push.tempStatements([
            { isCorrect: true, text: "", tag: correctStatementsTag },
            { isCorrect: true, text: "  ", tag: correctStatementsTag },
            { isCorrect: false, text: "B is false", tag: incorrectStatementsTag }
        ]);
        const params = {
            name: "CategoryName",
            domainId: domain.domain.title,
            thesisText: "Thesis text",
            correctStatementsTag: correctStatementsTag,
            incorrectStatementsTag: incorrectStatementsTag
        };
        const expectedMessage = "Both thesis correct statements and incorrect statements must be provided together";
        expect(messageHandler.createCategory(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail if the incorrectStatements contains only empty texts", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain' });
        const correctStatementsTag = "$:/temp/test/correct5";
        const incorrectStatementsTag = "$:/temp/test/incorrect5";
        options.push.tempStatements([
            { isCorrect: true, text: "A is true", tag: correctStatementsTag },
            { isCorrect: false, text: "", tag: incorrectStatementsTag },
            { isCorrect: false, text: "  ", tag: incorrectStatementsTag }
        ]);
        const params = {
            name: "CategoryName",
            domainId: domain.domain.title,
            thesisText: "Thesis text",
            correctStatementsTag: correctStatementsTag,
            incorrectStatementsTag: incorrectStatementsTag
        };
        const expectedMessage = "Both thesis correct statements and incorrect statements must be provided together";
        expect(messageHandler.createCategory(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should create a category tiddler with correct fields and a thesis when unique name and thesis are provided", () => {
        // consoleDebugSpy.and.callThrough();
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain' });
        const params = {
            name: "UniqueCategory",
            description: "UniqueCategory Description",
            domainId: domain.domain.title,
            thesisText: "Thesis text",
            thesisNote: "Thesis note"
        };
        messageHandler.createCategory(params, options.widget, options.env);
        const categoryTag = options.tags.category;
        const allCategories = options.wiki.getTiddlersWithTag(categoryTag);
        expect(allCategories.length).toBe(1);
        const categoryTiddler = options.wiki.getTiddler(allCategories[0]);
        expect(categoryTiddler.fields.name).toBe(params.name);
        expect(categoryTiddler.fields.text).toBe(params.description);
        expect(categoryTiddler.fields.tags).toContain(categoryTag);
        expect(categoryTiddler.fields.tags).toContain(domain.domain.title);
        const thesisTag = options.tags.thesis;
        const allTheses = options.wiki.getTiddlersWithTag(thesisTag);
        expect(allTheses.length).toBe(1);
        const thesisTiddler = options.wiki.getTiddler(allTheses[0]);
        expect(thesisTiddler.fields.text).toBe(params.thesisText);
        expect(thesisTiddler.fields.note).toBe(params.thesisNote);
        expect(thesisTiddler.fields.tags).toContain(thesisTag);
        expect(thesisTiddler.fields.tags).toContain(categoryTiddler.fields.title);
        console.debug("domains", options.wiki.filterTiddlers(`[tag[${options.tags.domain}]]`));
        console.debug("categories", options.wiki.filterTiddlers(`[tag[${options.tags.category}]]`));
        console.debug("theses", options.wiki.filterTiddlers(`[tag[${options.tags.thesis}]]`));
    });

    it("should create thesis with correct and incorrect statements when both are provided and non-empty", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain' });
        const correctStatementsTag = "$:/temp/test/correct6";
        const incorrectStatementsTag = "$:/temp/test/incorrect6";
        options.push.tempStatements([
            { isCorrect: true, text: "A is true", tag: correctStatementsTag },
            { isCorrect: false, text: "B is false", tag: incorrectStatementsTag }
        ]);
        const params = {
            name: "CategoryName",
            domainId: domain.domain.title,
            thesisText: "Thesis text",
            correctStatementsTag: correctStatementsTag,
            incorrectStatementsTag: incorrectStatementsTag
        };
        messageHandler.createCategory(params, options.widget, options.env);
        const thesisTag = options.tags.thesis;
        const allTheses = options.wiki.getTiddlersWithTag(thesisTag);
        expect(allTheses.length).toBe(1);
        const thesisTiddler = options.wiki.getTiddler(allTheses[0]);
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
        const domain = options.push.domain({ name: 'Domain' });
        const correctStatementsTag = "$:/temp/test/correct7";
        const incorrectStatementsTag = "$:/temp/test/incorrect7";
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
            name: "CategoryWithDupBoth",
            domainId: domain.domain.title,
            thesisText: "Thesis text",
            correctStatementsTag: correctStatementsTag,
            incorrectStatementsTag: incorrectStatementsTag
        };
        messageHandler.createCategory(params, options.widget, options.env);
        const thesisTag = options.tags.thesis;
        const allTheses = options.wiki.getTiddlersWithTag(thesisTag);
        expect(allTheses.length).toBe(1);
        const thesisTiddler = options.wiki.getTiddler(allTheses[0]);

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

});
