const utils = require("test/utils").zestTestUtils;
const messageHandler = require("$:/plugins/midorum/zest/modules/message-handler.js");
const Logger = $tw.utils.Logger.prototype;

describe("The migrate2 service", () => {
    var consoleSpy;
    var consoleDebugSpy;
    var loggerSpy;

    beforeEach(function () {
        consoleSpy = spyOn(console, 'log');
        consoleDebugSpy = spyOn(console, 'debug');
        loggerSpy = spyOn(Logger, 'alert');
    });

    it("should be defined", () => {
        expect(messageHandler.migrate2).toBeDefined();
    });

    it("should migrate theses with old format statements to new format", () => {
        // consoleDebugSpy.and.callThrough();
        // loggerSpy.and.callThrough();
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1' });
        const categories = options.push.categories_v1([{ name: "Category1", domains: [domain.domain] }]);
        const oldCorrectTexts = ["Correct statement 1", "Correct statement 2"];
        const oldIncorrectTexts = ["Incorrect statement 1"];
        const theses = options.push.theses_v0([{
            text: "Old format thesis",
            correctStatements: oldCorrectTexts,
            incorrectStatements: oldIncorrectTexts,
            categories: categories
        }]);
        options.debug.all("before migration");
        messageHandler.migrate2({}, options.widget, options.env);
        options.debug.all("after migration");
        const migrated = options.wiki.getTiddler(theses[0].title);
        expect(migrated.fields["zest-migrated-2"]).toBeDefined();
        // Verify statement tiddlers were created
        const correctStatementIds = $tw.utils.parseStringArray(migrated.fields["correct-statements"]);
        const incorrectStatementIds = $tw.utils.parseStringArray(migrated.fields["incorrect-statements"]);
        expect(correctStatementIds.length).toBe(2);
        expect(incorrectStatementIds.length).toBe(1);
        // Verify statement tiddlers exist and have correct text
        correctStatementIds.forEach((id, idx) => {
            const statementTiddler = options.wiki.getTiddler(id);
            expect(statementTiddler).toBeDefined();
            expect(statementTiddler.fields.text).toBe(oldCorrectTexts[idx]);
            expect(statementTiddler.fields.tags).toContain(options.tags.statement);
            expect(statementTiddler.fields.tags).toContain(options.tags.statementCorrect);
            expect(statementTiddler.fields.tags).toContain(theses[0].title);
        });
        incorrectStatementIds.forEach((id, idx) => {
            const statementTiddler = options.wiki.getTiddler(id);
            expect(statementTiddler).toBeDefined();
            expect(statementTiddler.fields.text).toBe(oldIncorrectTexts[idx]);
            expect(statementTiddler.fields.tags).toContain(options.tags.statement);
            expect(statementTiddler.fields.tags).toContain(options.tags.statementIncorrect);
            expect(statementTiddler.fields.tags).toContain(theses[0].title);
        });
    });

    it("should skip theses that already have new format (statement IDs)", () => {
        // consoleDebugSpy.and.callThrough();
        // loggerSpy.and.callThrough();
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1' });
        const categories = options.push.categories_v1([{ name: "Category1", domains: [domain.domain] }]);
        const theses = options.push.theses_v1([
            {
                text: "New schema thesis",
                correctStatements: ["Correct 1"],
                incorrectStatements: ["Incorrect 1"],
                categories: categories
            }
        ]);
        const before = options.wiki.getTiddler(theses[0].title);
        const beforeCorrectIds = before.fields["correct-statements"];
        const beforeIncorrectIds = before.fields["incorrect-statements"];
        options.debug.all("before migration");
        messageHandler.migrate2({}, options.widget, options.env);
        options.debug.all("after migration");
        const after = options.wiki.getTiddler(theses[0].title);
        expect(after.fields["zest-migrated-2"]).toBeDefined();
        expect(after.fields["correct-statements"]).toBe(beforeCorrectIds);
        expect(after.fields["incorrect-statements"]).toBe(beforeIncorrectIds);
    });

    it("should skip theses that are already migrated", () => {
        // consoleDebugSpy.and.callThrough();
        // loggerSpy.and.callThrough();
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1' });
        const categories = options.push.categories_v1([{ name: "Category1", domains: [domain.domain] }]);
        // Create thesis with migration marker but broken data
        const thesisTitle = "$:/zest/db/thesis/test3";
        const thesisTag = "$:/zest/tags/thesis";
        const oldCorrectTexts = ["Broken correct statement"];
        options.wiki.addTiddler(new $tw.Tiddler({
            title: thesisTitle,
            text: "Already migrated but broken",
            "correct-statements": $tw.utils.stringifyList(oldCorrectTexts),
            "zest-migrated-2": "1234567890",
            tags: [thesisTag, categories[0].title]
        }));
        const before = options.wiki.getTiddler(thesisTitle);
        options.debug.all("before migration");
        messageHandler.migrate2({}, options.widget, options.env);
        options.debug.all("after migration");
        const after = options.wiki.getTiddler(thesisTitle);
        expect(after.fields["zest-migrated-2"]).toBe(before.fields["zest-migrated-2"]);
        expect(after.fields["correct-statements"]).toBe(before.fields["correct-statements"]);
    });

    it("should skip theses with no statements but mark them as migrated", () => {
        // consoleDebugSpy.and.callThrough();
        // loggerSpy.and.callThrough();
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1' });
        const categories = options.push.categories_v1([{ name: "Category1", domains: [domain.domain] }]);
        // Create thesis without statements
        const thesisTitle = "$:/zest/db/thesis/test4";
        const thesisTag = "$:/zest/tags/thesis";
        options.wiki.addTiddler(new $tw.Tiddler({
            title: thesisTitle,
            text: "Thesis without statements",
            tags: [thesisTag, categories[0].title]
        }));
        const before = options.wiki.getTiddler(thesisTitle);
        expect(before.fields["correct-statements"]).toBeUndefined();
        expect(before.fields["incorrect-statements"]).toBeUndefined();
        options.debug.all("before migration");
        messageHandler.migrate2({}, options.widget, options.env);
        options.debug.all("after migration");
        const after = options.wiki.getTiddler(thesisTitle);
        expect(after.fields["zest-migrated-2"]).toBeDefined();
        expect(after.fields["correct-statements"]).toBeUndefined();
        expect(after.fields["incorrect-statements"]).toBeUndefined();
    });

    it("should create a migration log tiddler with summary", () => {
        // consoleDebugSpy.and.callThrough();
        // loggerSpy.and.callThrough();
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1' });
        const categories = options.push.categories_v1([{ name: "Category1", domains: [domain.domain] }]);
        const old_schema_theses = options.push.theses_v0([
            {
                text: "Old schema 1",
                correctStatements: ["Correct 1"],
                incorrectStatements: ["Incorrect 1"],
                categories: categories
            },
            {
                text: "Old schema 2",
                correctStatements: ["Correct 2"],
                incorrectStatements: ["Incorrect 2"],
                categories: categories
            }
        ]);
        const new_schema_theses = options.push.theses_v1([
            {
                text: "New schema 1",
                correctStatements: ["Correct"],
                incorrectStatements: ["Incorrect"],
                categories: categories
            },
            {
                text: "New schema 2",
                correctStatements: ["Correct"],
                incorrectStatements: ["Incorrect"],
                categories: categories
            }
        ]);
        options.debug.all("\nbefore migration");
        messageHandler.migrate2({}, options.widget, options.env);
        options.debug.all("\nafter migration");
        const logTiddler = options.wiki.getTiddler(options.wiki.filterTiddlers(`[tag[${options.tags.migration2}]]`)[0]);
        // console.debug(logTiddler)
        expect(logTiddler).toBeDefined();
        expect(logTiddler.fields.text).toContain("Migration run at:");
        expect(logTiddler.fields.text).toContain("Migration type: migrate2");
        expect(logTiddler.fields.text).toContain("Migration cause: changed statement storage from text lists to separate tiddlers");
        expect(logTiddler.fields.text).toContain("Migrated count: 2");
        expect(logTiddler.fields.text).toContain("Skipped count: 2");
        const migratedTitlesSectionStart = logTiddler.fields.text.indexOf("Migrated thesis titles:");
        const skippedTitlesSectionStart = logTiddler.fields.text.indexOf("Skipped thesis titles (reason):");
        // Verify old theses are in migrated section
        expect(logTiddler.fields.text).toContain(old_schema_theses[0].title);
        const old0_idx = logTiddler.fields.text.indexOf(old_schema_theses[0].title);
        expect(old0_idx).toBeGreaterThan(migratedTitlesSectionStart);
        expect(old0_idx).toBeLessThan(skippedTitlesSectionStart);
        const old1_idx = logTiddler.fields.text.indexOf(old_schema_theses[1].title);
        expect(old1_idx).toBeGreaterThan(migratedTitlesSectionStart);
        expect(old1_idx).toBeLessThan(skippedTitlesSectionStart);
        // Verify new theses are in skipped section
        const new0_idx = logTiddler.fields.text.indexOf(new_schema_theses[0].title);
        expect(new0_idx).toBeGreaterThan(skippedTitlesSectionStart);
        const new1_idx = logTiddler.fields.text.indexOf(new_schema_theses[1].title);
        expect(new1_idx).toBeGreaterThan(skippedTitlesSectionStart);
    });

    it("should be idempotent - running migration twice should not change results", () => {
        // consoleDebugSpy.and.callThrough();
        // loggerSpy.and.callThrough();
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1' });
        const categories = options.push.categories_v1([{ name: "Category1", domains: [domain.domain] }]);
        const theses = options.push.theses_v0([{
            text: "Old schema",
            correctStatements: ["Correct statement"],
            incorrectStatements: ["Incorrect statement"],
            categories: categories
        }]);
        options.debug.all("\nbefore first migration");
        messageHandler.migrate2({}, options.widget, options.env);
        const afterFirstRun = options.wiki.getTiddler(theses[0].title);
        const firstMigrationTime = afterFirstRun.fields["zest-migrated-2"];
        const firstCorrectIds = afterFirstRun.fields["correct-statements"];
        const firstIncorrectIds = afterFirstRun.fields["incorrect-statements"];
        setTimeout(() => { }, 100);
        options.debug.all("\nbefore second migration");
        messageHandler.migrate2({}, options.widget, options.env);
        options.debug.all("\nafter all migrations");
        const afterSecondRun = options.wiki.getTiddler(theses[0].title);
        const secondMigrationTime = afterSecondRun.fields["zest-migrated-2"];
        const secondCorrectIds = afterSecondRun.fields["correct-statements"];
        const secondIncorrectIds = afterSecondRun.fields["incorrect-statements"];
        // Migration marker should not change
        expect(secondMigrationTime).toBe(firstMigrationTime);
        // Statement IDs should not change
        expect(secondCorrectIds).toBe(firstCorrectIds);
        expect(secondIncorrectIds).toBe(firstIncorrectIds);
    });

});
