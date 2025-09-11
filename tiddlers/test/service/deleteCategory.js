const utils = require("test/utils").zestTestUtils;
const messageHandler = require("$:/plugins/midorum/zest/modules/message-handler.js");
const Logger = $tw.utils.Logger.prototype;

describe("The deleteCategory service", () => {
    var consoleSpy;
    var consoleDebugSpy;
    var loggerSpy;

    beforeEach(function () {
        consoleSpy = spyOn(console, 'log');
        consoleDebugSpy = spyOn(console, 'debug');
        loggerSpy = spyOn(Logger, 'alert');
    });

    it("should be defined", () => {
        expect(messageHandler.deleteCategory).toBeDefined();
    });

    it("should fail when the 'id' argument is not passed", () => {
        const options = utils.setupWiki();
        const params = { id: undefined };
        const expectedMessage = "Category id is required";
        expect(messageHandler.deleteCategory(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should fail when the category does not exist", () => {
        const options = utils.setupWiki();
        const params = { id: "$:/zest/db/category/nonexistent" };
        const expectedMessage = "Category not found";
        expect(messageHandler.deleteCategory(params, options.widget, options.env)).nothing();
        expect(Logger.alert).toHaveBeenCalledTimes(1);
        const results = Logger.alert.calls.first().args;
        expect(results[0]).toContain(expectedMessage);
    });

    it("should delete the category and all linked theses", () => {
        const options = utils.setupWiki();
        const domain = options.push.domain({
            name: 'Domain1', categories: [
                { name: 'Category1', theses: [{ text: 'Thesis1' }, { text: 'Thesis2' }] },
                { name: 'Category2', theses: [{ text: 'Thesis2' }] }
            ]
        });
        const categoryId = domain.categories[0].title;
        const linkedThesis1 = domain.categories[0].theses[0].title;
        const linkedThesis2 = domain.categories[0].theses[1].title;
        const thesisTag = options.tags.thesis;
        expect(options.wiki.filterTiddlers(`[tag[${thesisTag}]tag[${categoryId}]]`).length).toEqual(2);
        const params = { id: categoryId };
        messageHandler.deleteCategory(params, options.widget, options.env);
        const catTiddler = options.wiki.getTiddler(categoryId);
        expect(catTiddler).toBeUndefined();
        expect(options.wiki.filterTiddlers(`[tag[${thesisTag}]tag[${categoryId}]]`).length).toBe(0);
        expect(options.wiki.getTiddler(linkedThesis1)).toBeUndefined();
        expect(options.wiki.getTiddler(linkedThesis2)).toBeUndefined();
    });
});
