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

    it("should delete the category and all theses that are linked only to this category and detach other linked theses", () => {
        // consoleDebugSpy.and.callThrough();
        const options = utils.setupWiki();
        const domain1 = options.push.domain({ name: "Domain1", description: "Domain1 description" });
        const domain2 = options.push.domain({ name: "Domain2", description: "Domain2 description" });
        const categories = options.push.categories_last([
            { name: "Category1", domains: [domain1.domain, domain2.domain] },
            { name: "Category2", domains: [domain2.domain] }
        ])
        const theses = options.push.theses_last([
            { text: "Thesis1", note: "Thesis1 note", categories: categories.slice(0, 1) },
            { text: "Thesis2", note: "Thesis2 note", categories: categories },
            { text: "Thesis3", note: "Thesis3 note", categories: categories.slice(1) }
        ])
        options.wiki.filterTiddlers(`[tag[${options.tags.domain}]]`).forEach(domain => {
            console.debug(options.wiki.getTiddler(domain));
        });
        options.wiki.filterTiddlers(`[tag[${options.tags.category}]]`).forEach(category => {
            console.debug(options.wiki.getTiddler(category));
        });
        options.wiki.filterTiddlers(`[tag[${options.tags.thesis}]]`).forEach(thesis => {
            console.debug(options.wiki.getTiddler(thesis));
        });
        expect(options.wiki.filterTiddlers(`[tag[${options.tags.thesis}]tag[${categories[0].title}]]`).length).toEqual(2);
        expect(options.wiki.filterTiddlers(`[tag[${options.tags.thesis}]tag[${categories[1].title}]]`).length).toEqual(2);
        const params = { id: categories[0].title };
        messageHandler.deleteCategory(params, options.widget, options.env);
        expect(options.wiki.getTiddler(categories[0].title)).toBeUndefined();
        expect(options.wiki.getTiddler(categories[1].title)).toBeDefined();
        expect(options.wiki.filterTiddlers(`[tag[${options.tags.thesis}]tag[${categories[0].title}]]`).length).toBe(0);
        expect(options.wiki.getTiddler(theses[0].title)).toBeUndefined();
        expect(options.wiki.getTiddler(theses[1].title)).toBeDefined();
        expect(options.wiki.getTiddler(theses[2].title)).toBeDefined();
    });

    it("should delete the category and statement tiddlers of theses linked only to this category", () => {
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
                        correctStatements: ['Thesis2 correct statement 1'],
                        incorrectStatements: ['Thesis2 incorrect statement 1']
                    }
                ]
            }]
        });
        const category = domain.categories[0];
        const thesis1 = category.theses[0];
        const thesis2 = category.theses[1];

        // Get statement IDs from thesis1
        const thesisTiddler1 = options.wiki.getTiddler(thesis1.title);
        const correctStatements1 = thesisTiddler1.fields["correct-statements"];
        const incorrectStatements1 = thesisTiddler1.fields["incorrect-statements"];
        const correctStatementIds1 = $tw.utils.parseStringArray(correctStatements1);
        const incorrectStatementIds1 = $tw.utils.parseStringArray(incorrectStatements1);

        // Get statement IDs from thesis2
        const thesisTiddler2 = options.wiki.getTiddler(thesis2.title);
        const correctStatements2 = thesisTiddler2.fields["correct-statements"];
        const incorrectStatements2 = thesisTiddler2.fields["incorrect-statements"];
        const correctStatementIds2 = $tw.utils.parseStringArray(correctStatements2);
        const incorrectStatementIds2 = $tw.utils.parseStringArray(incorrectStatements2);

        // Verify all statement tiddlers exist before deletion
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

        // Delete the category
        const params = { id: category.title };
        messageHandler.deleteCategory(params, options.widget, options.env);
        expect(Logger.alert).toHaveBeenCalledTimes(0);

        // Verify category is deleted
        expect(options.wiki.getTiddler(category.title)).toBeUndefined();

        // Verify both theses are deleted (they were linked only to this category)
        expect(options.wiki.getTiddler(thesis1.title)).toBeUndefined();
        expect(options.wiki.getTiddler(thesis2.title)).toBeUndefined();

        // Verify all statement tiddlers are also deleted
        correctStatementIds1.forEach(id => {
            expect(options.wiki.getTiddler(id)).toBeUndefined();
        });
        incorrectStatementIds1.forEach(id => {
            expect(options.wiki.getTiddler(id)).toBeUndefined();
        });
        correctStatementIds2.forEach(id => {
            expect(options.wiki.getTiddler(id)).toBeUndefined();
        });
        incorrectStatementIds2.forEach(id => {
            expect(options.wiki.getTiddler(id)).toBeUndefined();
        });
    });

    it("should delete statements only for theses linked exclusively to deleted category", () => {
        const options = utils.setupWiki();
        const domain1 = options.push.domain({ name: "Domain1" });
        const domain2 = options.push.domain({ name: "Domain2" });
        const categories = options.push.categories_last([
            { name: "Category1", domains: [domain1.domain] },
            { name: "Category2", domains: [domain2.domain] }
        ]);

        // Thesis1: linked only to Category1 (will be deleted with statements)
        const theses1 = options.push.theses_last([
            {
                text: "Thesis1",
                correctStatements: ['Thesis1 correct 1', 'Thesis1 correct 2'],
                incorrectStatements: ['Thesis1 incorrect 1', 'Thesis1 incorrect 2'],
                categories: [categories[0]]
            }
        ]);

        // Thesis2: linked to both categories (will be detached, statements preserved)
        const theses2 = options.push.theses_last([
            {
                text: "Thesis2",
                correctStatements: ['Thesis2 correct 1'],
                incorrectStatements: ['Thesis2 incorrect 1'],
                categories: categories
            }
        ]);

        const thesis1 = theses1[0];
        const thesis2 = theses2[0];

        // Get statement IDs
        const thesis1Tiddler = options.wiki.getTiddler(thesis1.title);
        const thesis1CorrectIds = $tw.utils.parseStringArray(thesis1Tiddler.fields["correct-statements"]);
        const thesis1IncorrectIds = $tw.utils.parseStringArray(thesis1Tiddler.fields["incorrect-statements"]);

        const thesis2Tiddler = options.wiki.getTiddler(thesis2.title);
        const thesis2CorrectIds = $tw.utils.parseStringArray(thesis2Tiddler.fields["correct-statements"]);
        const thesis2IncorrectIds = $tw.utils.parseStringArray(thesis2Tiddler.fields["incorrect-statements"]);

        // Verify all statements exist
        [...thesis1CorrectIds, ...thesis1IncorrectIds, ...thesis2CorrectIds, ...thesis2IncorrectIds].forEach(id => {
            expect(options.wiki.getTiddler(id)).toBeDefined();
        });

        // Delete Category1
        messageHandler.deleteCategory({ id: categories[0].title }, options.widget, options.env);

        // Thesis1 should be deleted with its statements
        expect(options.wiki.getTiddler(thesis1.title)).toBeUndefined();
        thesis1CorrectIds.forEach(id => {
            expect(options.wiki.getTiddler(id)).toBeUndefined();
        });
        thesis1IncorrectIds.forEach(id => {
            expect(options.wiki.getTiddler(id)).toBeUndefined();
        });

        // Thesis2 should still exist with its statements (only detached from Category1)
        expect(options.wiki.getTiddler(thesis2.title)).toBeDefined();
        thesis2CorrectIds.forEach(id => {
            expect(options.wiki.getTiddler(id)).toBeDefined();
        });
        thesis2IncorrectIds.forEach(id => {
            expect(options.wiki.getTiddler(id)).toBeDefined();
        });

        // Verify Category2 and Category1 status
        expect(options.wiki.getTiddler(categories[0].title)).toBeUndefined();
        expect(options.wiki.getTiddler(categories[1].title)).toBeDefined();
    });
});
