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

    it("should fail when thesis text is not provided", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain' });
        const params = { name: "CategoryName", thesisText: undefined, domainId: domain.domain.title };
        const expectedMessage = "thesis text cannot be empty";
        expect(messageHandler.createCategory(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail if only correctStatements is provided", () => {
        // consoleDebugSpy.and.callThrough();
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain' });
        const params = {
            name: "CategoryName",
            domainId: domain.domain.title,
            thesisText: "Thesis text",
            thesisCorrectStatements: "[[A is true]]"
        };
        const expectedMessage = "Both thesis correct statements and incorrect statements must be provided together";
        expect(messageHandler.createCategory(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail if only incorrectStatements is provided", () => {
        // consoleDebugSpy.and.callThrough();
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain' });
        const params = {
            name: "CategoryName",
            domainId: domain.domain.title,
            thesisText: "Thesis text",
            thesisIncorrectStatements: "[[B is false]]"
        };
        const expectedMessage = "Both thesis correct statements and incorrect statements must be provided together";
        expect(messageHandler.createCategory(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail if the correctStatements is empty array", () => {
        // consoleDebugSpy.and.callThrough();
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain' });
        const params = {
            name: "CategoryName",
            domainId: domain.domain.title,
            thesisText: "Thesis text",
            thesisCorrectStatements: "[[]]",
            thesisIncorrectStatements: "[[B is false]]"
        };
        const expectedMessage = "Both thesis correct statements and incorrect statements must be non-empty arrays";
        expect(messageHandler.createCategory(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail if the incorrectStatements is empty array", () => {
        // consoleDebugSpy.and.callThrough();
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain' });
        const params = {
            name: "CategoryName",
            domainId: domain.domain.title,
            thesisText: "Thesis text",
            thesisCorrectStatements: "[[A is true]]",
            thesisIncorrectStatements: "[[]]"
        };
        const expectedMessage = "Both thesis correct statements and incorrect statements must be non-empty arrays";
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
            domainId: domain.domain.title,
            thesisText: "Thesis text",
            thesisNote: "Thesis note"
        };
        messageHandler.createCategory(params, options.widget, options.env);
        const categoryTag = options.tags.category;
        const allCategories = options.wiki.getTiddlersWithTag(categoryTag);
        expect(allCategories.length).toBe(1);
        const categoryTiddler = options.wiki.getTiddler(allCategories[0]);
        expect(categoryTiddler.fields.text).toBe(params.name);
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
        // consoleDebugSpy.and.callThrough();
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain' });
        const params = {
            name: "CategoryName",
            domainId: domain.domain.title,
            thesisText: "Thesis text",
            thesisCorrectStatements: "[[A is true]]",
            thesisIncorrectStatements: "[[B is false]]"
        };
        messageHandler.createCategory(params, options.widget, options.env);
        const thesisTag = options.tags.thesis;
        const allTheses = options.wiki.getTiddlersWithTag(thesisTag);
        expect(allTheses.length).toBe(1);
        const thesisTiddler = options.wiki.getTiddler(allTheses[0]);
        expect(thesisTiddler.fields["correct-statements"]).toEqual(params.thesisCorrectStatements);
        expect(thesisTiddler.fields["incorrect-statements"]).toEqual(params.thesisIncorrectStatements);
        console.debug("domains", options.wiki.filterTiddlers(`[tag[${options.tags.domain}]]`));
        console.debug("categories", options.wiki.filterTiddlers(`[tag[${options.tags.category}]]`));
        console.debug("theses", options.wiki.filterTiddlers(`[tag[${options.tags.thesis}]]`));
        console.debug("thesis tiddler", thesisTiddler);
    });

    it("should merge duplicate statements in both correct and incorrect lists", () => {
        // consoleDebugSpy.and.callThrough();
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain' });
        const params = {
            name: "CategoryWithDupBoth",
            domainId: domain.domain.title,
            thesisText: "Thesis text",
            thesisCorrectStatements: "[[A is true]] [[A is true]] [[B is true]]",
            thesisIncorrectStatements: "[[C is false]] [[C is false]] [[D is false]] [[D is false]]"
        };
        messageHandler.createCategory(params, options.widget, options.env);
        const thesisTag = options.tags.thesis;
        const allTheses = options.wiki.getTiddlersWithTag(thesisTag);
        expect(allTheses.length).toBe(1);
        const thesisTiddler = options.wiki.getTiddler(allTheses[0]);
        expect(thesisTiddler.fields["correct-statements"]).toEqual("[[A is true]] [[B is true]]");
        expect(thesisTiddler.fields["incorrect-statements"]).toEqual("[[C is false]] [[D is false]]");
    });

});
