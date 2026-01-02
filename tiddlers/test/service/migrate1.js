const utils = require("test/utils").zestTestUtils;
const messageHandler = require("$:/plugins/midorum/zest/modules/message-handler.js");
const Logger = $tw.utils.Logger.prototype;

describe("The migrate1 service", () => {
    var consoleSpy;
    var consoleDebugSpy;
    var loggerSpy;

    beforeEach(function () {
        consoleSpy = spyOn(console, 'log');
        consoleDebugSpy = spyOn(console, 'debug');
        loggerSpy = spyOn(Logger, 'alert');
    });

    it("should be defined", () => {
        expect(messageHandler.migrate1).toBeDefined();
    });

    it("should migrate categories with text field to name field", () => {
        // consoleDebugSpy.and.callThrough();
        // loggerSpy.and.callThrough();
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1' });
        const categories = options.push.categories_v0([{ name: "Old schema", domains: [domain.domain] }])
        options.debug.all("before migration");
        messageHandler.migrate1({}, options.widget, options.env);
        options.debug.all("after migration");
        const migrated = options.wiki.getTiddler(categories[0].title);
        expect(migrated.fields.name).toBe("Old schema");
        expect(migrated.fields.text).toBeUndefined();
        expect(migrated.fields["zest-migrated-1"]).toBeDefined();
    });

    it("should skip categories that already have name field", () => {
        // consoleDebugSpy.and.callThrough();
        // loggerSpy.and.callThrough();
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1' });
        const categories = options.push.categories_v1([{ name: "New schema", domains: [domain.domain], description: "Some description" }])
        options.debug.all("before migration");
        messageHandler.migrate1({}, options.widget, options.env);
        options.debug.all("after migration");
        const category = options.wiki.getTiddler(categories[0].title);
        expect(category.fields.name).toBe("New schema");
        expect(category.fields.text).toBe("Some description");
    });

    it("should skip categories that are already migrated", () => {
        // consoleDebugSpy.and.callThrough();
        // loggerSpy.and.callThrough();
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1' });
        const categoryTitle = "$:/zest/db/category/test3";
        const categoryTag = "$:/zest/tags/category";
        options.wiki.addTiddler(new $tw.Tiddler({
            title: categoryTitle,
            text: "Already migrated but broken",
            "zest-migrated-1": "1234567890",
            tags: [categoryTag, domain.domain.title]
        }));
        const before = options.wiki.getTiddler(categoryTitle);
        options.debug.all("before migration");
        messageHandler.migrate1({}, options.widget, options.env);
        options.debug.all("after migration");
        const after = options.wiki.getTiddler(categoryTitle);
        expect(after.fields["zest-migrated-1"]).toBe(before.fields["zest-migrated-1"]);
        expect(after.fields.name).toBe(before.fields.name);
        expect(after.fields.text).toBe(before.fields.text);
    });

    it("should skip categories with empty text field", () => {
        // consoleDebugSpy.and.callThrough();
        // loggerSpy.and.callThrough();
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1' });
        // Create a category with empty text
        const categoryTitle = "$:/zest/db/category/test4";
        const categoryTag = "$:/zest/tags/category";
        options.wiki.addTiddler(new $tw.Tiddler({
            title: categoryTitle,
            text: "",
            tags: [categoryTag, domain.domain.title]
        }));
        const before = options.wiki.getTiddler(categoryTitle);
        options.debug.all("before migration");
        messageHandler.migrate1({}, options.widget, options.env);
        options.debug.all("after migration");
        const after = options.wiki.getTiddler(categoryTitle);
        expect(after.fields["zest-migrated-1"]).toBe(before.fields["zest-migrated-1"]);
        expect(after.fields.name).toBe(before.fields.name);
        expect(after.fields.text).toBe(before.fields.text);
    });

    it("should create a migration log tiddler with summary", () => {
        // consoleDebugSpy.and.callThrough();
        // loggerSpy.and.callThrough();
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1' });
        const old_schema_categories = options.push.categories_v0([
            { name: "Old schema", domains: [domain.domain] },
            { name: "Old schema 2", domains: [domain.domain] }
        ])
        const new_schema_categories = options.push.categories_v1([
            { name: "New schema", domains: [domain.domain], description: "Some description" },
            { name: "New schema 2", domains: [domain.domain], description: "Some description" }
        ]
        )
        options.debug.all("\nbefore migration");
        messageHandler.migrate1({}, options.widget, options.env);
        options.debug.all("\nafter migration");
        const logTiddler = options.wiki.getTiddler(options.wiki.filterTiddlers(`[tag[${options.tags.migration1}]]`)[0]);
        // console.debug(logTiddler)
        expect(logTiddler).toBeDefined();
        expect(logTiddler.fields.text).toContain("Migration run at:");
        expect(logTiddler.fields.text).toContain("Migration type: migrate1");
        expect(logTiddler.fields.text).toContain("Migration cause: changed category data schema");
        expect(logTiddler.fields.text).toContain("Migrated count: 2");
        expect(logTiddler.fields.text).toContain("Skipped count: 2");
        const migratedTitlesSectionStart = logTiddler.fields.text.indexOf("Migrated titles:");
        const skippedTitlesSectionStart = logTiddler.fields.text.indexOf("Skipped titles (reason):");
        expect(logTiddler.fields.text).toContain(old_schema_categories[0].title);
        const old0_idx = logTiddler.fields.text.indexOf(old_schema_categories[0].title);
        expect(old0_idx).toBeGreaterThan(migratedTitlesSectionStart);
        expect(old0_idx).toBeLessThan(skippedTitlesSectionStart);
        const old1_idx = logTiddler.fields.text.indexOf(old_schema_categories[1].title);
        expect(old1_idx).toBeGreaterThan(migratedTitlesSectionStart);
        expect(old1_idx).toBeLessThan(skippedTitlesSectionStart);
        const new0_idx = logTiddler.fields.text.indexOf(new_schema_categories[0].title);
        expect(new0_idx).toBeGreaterThan(skippedTitlesSectionStart);
        const new1_idx = logTiddler.fields.text.indexOf(new_schema_categories[1].title);
        expect(new1_idx).toBeGreaterThan(skippedTitlesSectionStart);
    });

    it("should be idempotent - running migration twice should not change results", () => {
        // consoleDebugSpy.and.callThrough();
        // loggerSpy.and.callThrough();
        const options = utils.setupWiki();
        const domain = options.push.domain({ name: 'Domain1' });
        const categories = options.push.categories_v0([{ name: "Old schema", domains: [domain.domain] }])
        options.debug.all("\nbefore first migration");
        messageHandler.migrate1({}, options.widget, options.env);
        const afterFirstRun = options.wiki.getTiddler(categories[0].title);
        const firstMigrationTime = afterFirstRun.fields["zest-migrated-1"];
        setTimeout(() => { }, 100)
        options.debug.all("\nbefore second migration");
        messageHandler.migrate1({}, options.widget, options.env);
        options.debug.all("\nafter all migrations");
        const afterSecondRun = options.wiki.getTiddler(categories[0].title);
        const secondMigrationTime = afterFirstRun.fields["zest-migrated-1"];
        expect(afterSecondRun.fields.name).toBe("Old schema");
        expect(secondMigrationTime).toBe(firstMigrationTime);
    });

});
