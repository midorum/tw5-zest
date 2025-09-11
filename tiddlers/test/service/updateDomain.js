const utils = require("test/utils").zestTestUtils;
const messageHandler = require("$:/plugins/midorum/zest/modules/message-handler.js");
const Logger = $tw.utils.Logger.prototype;

describe("The updateDomain service", () => {
    var consoleSpy;
    var consoleDebugSpy;
    var loggerSpy;

    beforeEach(function () {
        consoleSpy = spyOn(console, 'log');
        consoleDebugSpy = spyOn(console, 'debug');
        loggerSpy = spyOn(Logger, 'alert');
    });

    it("should be defined", () => {
        expect(messageHandler.updateDomain).toBeDefined();
    })

    it("should fail when the 'id' argument is not passed", () => {
        const options = utils.setupWiki();
        const params = {
            id: undefined,
        };
        const expectedMessage = "Domain id is required";
        expect(messageHandler.updateDomain(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    })

    it("should fail when the 'name' argument is not passed", () => {
        // consoleDebugSpy.and.callThrough();
        const options = utils.setupWiki();
        const domainToEdit = options.push.domain({ name: 'domainToEdit' });
        const params = {
            id: domainToEdit.domain.title,
            name: undefined,
        };
        const expectedMessage = "name cannot be empty";
        expect(messageHandler.updateDomain(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    })

    it("should fail when the 'name' argument is an empty string", () => {
        const options = utils.setupWiki();
        const domainToEdit = options.push.domain({ name: 'domainToEdit' });
        const params = {
            id: domainToEdit.domain.title,
            name: "",
        };
        const expectedMessage = "name cannot be empty";
        expect(messageHandler.updateDomain(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    })

    it("should fail when the 'name' already exists", () => {
        // consoleDebugSpy.and.callThrough();
        const options = utils.setupWiki();
        const existed = options.push.domain({ name: 'existedDomain' });
        const domainToEdit = options.push.domain({ name: 'domainToEdit' });
        const params = {
            id: domainToEdit.domain.title,
            name: existed.domain.name
        };
        messageHandler.updateDomain(params, options.widget, options.env);
        expect(Logger.alert).toHaveBeenCalledWith("Domain with this name already exists");
    })

    it("should update the domain when all parameters are valid", () => {
        const options = utils.setupWiki();
        const domainToEdit = options.push.domain({ name: 'domainToEdit', description: "old description" });
        const params = {
            id: domainToEdit.domain.title,
            name: "newDomainName",
            description: "new description"
        };
        messageHandler.updateDomain(params, options.widget, options.env);
        expect(Logger.alert).toHaveBeenCalledTimes(0);
        const tiddler = options.wiki.getTiddler(domainToEdit.domain.title);
        expect(tiddler.fields.name).toEqual(params.name);
        expect(tiddler.fields.text).toEqual(params.description);
    })

    it("should remove the domain description if the 'description' parameter is empty", () => {
        const options = utils.setupWiki();
        const domainToEdit = options.push.domain({ name: 'domainToEdit', description: "old description" });
        const params = {
            id: domainToEdit.domain.title,
            name: domainToEdit.domain.name,
            description: ""
        };
        messageHandler.updateDomain(params, options.widget, options.env);
        expect(Logger.alert).toHaveBeenCalledTimes(0);
        const tiddler = options.wiki.getTiddler(domainToEdit.domain.title);
        expect(tiddler.fields.name).toEqual(params.name);
        expect(tiddler.fields.text).toBeUndefined();
    });

});
