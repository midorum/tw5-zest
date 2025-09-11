const utils = require("test/utils").zestTestUtils;
const messageHandler = require("$:/plugins/midorum/zest/modules/message-handler.js");
const Logger = $tw.utils.Logger.prototype;

describe("The createDomain service", () => {
    var consoleSpy;
    var consoleDebugSpy;
    var loggerSpy;

    beforeEach(function () {
        consoleSpy = spyOn(console, 'log');
        consoleDebugSpy = spyOn(console, 'debug');
        loggerSpy = spyOn(Logger, 'alert');
    });

    it("should be defined", () => {
        expect(messageHandler.createDomain).toBeDefined();
    })

    it("should fail when the 'name' argument is not passed", () => {
        const options = utils.setupWiki();
        const name = undefined;
        const log = true;
        const idle = true;
        const params = {
            name: name,
            log: log,
            idle: idle
        };
        const expectedMessage = "name cannot be empty";
        // consoleDebugSpy.and.callThrough();
        expect(messageHandler.createDomain(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    })

    it("should fail when the 'name' argument is an empty string", () => {
        const options = utils.setupWiki();
        const name = "";
        const log = true;
        const idle = true;
        const params = {
            name: name,
            log: log,
            idle: idle
        };
        const expectedMessage = "name cannot be empty";
        expect(messageHandler.createDomain(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    })

    it("should fail when the 'name' already exists", () => {
        // consoleDebugSpy.and.callThrough();
        const options = utils.setupWiki();
        const existed = options.push.domain({ name: 'existedDomain' });
        const params = { name: existed.domain.name };
        messageHandler.createDomain(params, options.widget, options.env);
        expect(Logger.alert).toHaveBeenCalledWith("Domain with this name already exists");
    })

    it("should create a domain tiddler with correct fields when unique name and description are provided", () => {
        // consoleDebugSpy.and.callThrough();
        const options = utils.setupWiki();
        const params = { name: "UniqueDomainName", description: "Domain description" };
        messageHandler.createDomain(params, options.widget, options.env);
        const domainTag = options.tags.domain;
        const allDomains = options.wiki.getTiddlersWithTag(domainTag);
        expect(allDomains.length).toBe(1);
        const domainTiddler = options.wiki.getTiddler(allDomains[0]);
        console.debug(domainTiddler);
        expect(domainTiddler.fields.name).toBe(params.name);
        expect(domainTiddler.fields.text).toBe(params.description);
        expect(domainTiddler.fields.tags).toContain(domainTag);
    })

});
