const { test, expect } = require('@playwright/test');
const { model } = require('./helpers/utils')
const { ZestPage } = require('./helpers/zestPage')

test.describe.serial('regression', async () => {
    let zestPage;
    test.beforeEach(async ({ page }) => { zestPage = new ZestPage(page) })

    test('R-N-001 Open initial tiddler', async ({ page }) => {
        await zestPage.do.openInitialTiddler()
    })

    test('R-N-002 Navigate to Zest Home', async ({ page }) => {
        await zestPage.do.navigateToZestHome()
    })

    test('R-D-001 Create a test domain "Regression 1 Domain"', async ({ page }) => {
        const name = model.domain1.name
        const description = model.domain1.description
        await zestPage.do.navigateToZestHome()
        if (await zestPage.check.domainExists(name)) {
            console.log(`Domain "${name}" already exists - skip test`)
            return;
        }
        await zestPage.do.createTestDomain(name, description)
    })

    test('R-D-002 Create a test domain "Regression 2 Domain"', async ({ page }) => {
        const name = model.domain2.name
        const description = model.domain2.description
        await zestPage.do.navigateToZestHome()
        if (await zestPage.check.domainExists(name)) {
            console.log(`Domain "${name}" already exists - skip test`)
            return;
        }
        await zestPage.do.createTestDomain(name, description)
    })

    test('R-D-003 Create a test domain "Regression 3 Domain"', async ({ page }) => {
        const name = model.domain3.name
        const description = model.domain3.description
        await zestPage.do.navigateToZestHome()
        if (await zestPage.check.domainExists(name)) {
            console.log(`Domain "${name}" already exists - skip test`)
            return;
        }
        await zestPage.do.createTestDomain(name, description)
    })

    test('R-D-004 Cancel domain creation', async ({ page }) => {
        await zestPage.do.navigateToZestHome()
        await zestPage.do.cancelDomainCreation('Regression Domain Cancelled', 'Regression Domain Cancelled Description')
    })

    test('R-D-005 Navigate to the "Regression 1 Domain"', async ({ page }) => {
        await zestPage.do.navigateToDomain(model.domain1.name, model.domain1.description)
    })

    test('R-D-006 Edit the "Regression 3 Domain"', async ({ page }) => {
        const name = model.domain3.name
        const description = model.domain3.description
        const editedName = model.domain3Edited.name
        const editedDescription = model.domain3Edited.description
        await zestPage.do.navigateToDomain(name, description)
        await zestPage.do.editDomain(name, description, editedName, editedDescription)
        // await page.pause()
        await zestPage.do.navigateToDomain(editedName, editedDescription)
        await zestPage.do.editDomain(editedName, editedDescription, name, description)
        // await page.pause()
    })

    test('R-D-007 Delete the "Regression 3 Domain"', async ({ page }) => {
        const name = model.domain3.name
        const description = model.domain3.description
        await zestPage.do.navigateToDomain(name, description)
        await zestPage.do.deleteDomain(name)
    })

    test('R-D-009 Cancel editing the "Regression 2 Domain"', async () => {
        const name = model.domain2.name
        const description = model.domain2.description
        await zestPage.do.navigateToDomain(name, description)
        await zestPage.do.cancelEditDomain(name, description)
    })

    test('R-C-001 Create a test category "Regression 1 Category"', async ({ page }) => {
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const categoryName = model.category1.name
        const categoryDescription = model.category1.description
        const thesisText = model.category1.thesisText
        const thesisNote = model.category1.thesisNote
        await zestPage.do.navigateToDomain(domainName, domainDescription)
        if (await zestPage.check.categoryExists(categoryName)) {
            console.log(`Category "${categoryName}" already exists - skip test`)
            return;
        }
        await zestPage.do.createTestCategory(categoryName, categoryDescription, thesisText, thesisNote)
        await zestPage.check.categoryExistsInDomainList(categoryName)
    })

    test('R-D-008 Try to delete the "Regression 1 Domain" with linked categories (should fail)', async () => {
        const name = model.domain1.name
        const description = model.domain1.description
        await zestPage.do.navigateToDomain(name, description)
        await zestPage.do.failToDeleteDomainWithLinkedCategories(name)
    })

    test('R-C-002 Create a test category "Regression 2 Category"', async ({ page }) => {
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const categoryName = model.category2.name
        const categoryDescription = model.category2.description
        await zestPage.do.navigateToDomain(domainName, domainDescription)
        if (await zestPage.check.categoryExists(categoryName)) {
            console.log(`Category "${categoryName}" already exists - skip test`)
            return;
        }
        await zestPage.do.createTestCategory(categoryName, categoryDescription)
        await zestPage.check.categoryExistsInDomainList(categoryName)
    })

    test('R-C-003 Create a test category "Regression 3 Category"', async ({ page }) => {
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const categoryName = model.category3.name
        const categoryDescription = model.category3.description
        const thesisText = model.category3.thesisText
        const thesisNote = model.category3.thesisNote
        const correctStatements = model.category3.correctStatements
        const incorrectStatements = model.category3.incorrectStatements
        await zestPage.do.navigateToDomain(domainName, domainDescription)
        if (await zestPage.check.categoryExists(categoryName)) {
            console.log(`Category "${categoryName}" already exists - skip test`)
            return;
        }
        await zestPage.do.createTestCategory(categoryName, categoryDescription, thesisText, thesisNote, correctStatements, incorrectStatements)
        await zestPage.check.categoryExistsInDomainList(categoryName)
        await zestPage.do.navigateToCategory(categoryName)
        await zestPage.check.thesisStatementsAreVisible(correctStatements, incorrectStatements)
    })

    test('R-C-004 Navigate to the test category "Regression 1 Category"', async ({ page }) => {
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const categoryName = model.category1.name
        const categoryDescription = model.category1.description
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, categoryName, categoryDescription)
    })

    test('R-C-005 Edit the test category "Regression 3 Category"', async ({ page }) => {
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const name = model.category3.name
        const description = model.category3.description
        const editedName = model.category3Edited.name
        const editedDescription = model.category3Edited.description
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, name, description)
        await zestPage.do.editCategory(name, description, editedName, editedDescription)
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, editedName, editedDescription)
        await zestPage.do.editCategory(editedName, editedDescription, name, description)
    })

    test('R-C-006 Fail to delete category with wrong confirmation phrase', async ({ page }) => {
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const categoryName = model.category3.name
        const categoryDescription = model.category3.description
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, categoryName, categoryDescription)
        await zestPage.do.failToDeleteCategoryWithWrongPhrase(categoryName, 'delete')
    })

    test('R-C-007 Cancel deleting the test category "Regression 3 Category"', async ({ page }) => {
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const categoryName = model.category3.name
        const categoryDescription = model.category3.description
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, categoryName, categoryDescription)
        await zestPage.do.cancelDeleteCategoryAfterConfirmation(categoryName)
    })

    test('R-C-008 Delete the test category "Regression 3 Category"', async ({ page }) => {
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const categoryName = model.category3.name
        const categoryDescription = model.category3.description
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, categoryName, categoryDescription)
        await zestPage.do.deleteCategory(categoryName)
    })

    test('R-C-009 Cancel editing the "Regression 2 Category"', async () => {
        const categoryName = model.category2.name
        const categoryDescription = model.category2.description
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, categoryName, categoryDescription)
        await zestPage.do.cancelEditCategory(categoryName, categoryDescription)
    })

    test('R-C-010 Assign the "Regression 1 Category" to the "Regression 2 Domain"', async ({ page }) => {
        const categoryName = model.category1.name
        const categoryDescription = model.category1.description
        const sourceDomainName = model.domain1.name
        const sourceDomainDescription = model.domain1.description
        const targetDomainName = model.domain2.name
        await zestPage.do.navigateToCategoryFromDomain(sourceDomainName, sourceDomainDescription, categoryName, categoryDescription)
        await zestPage.do.assignCategoryToDomain(categoryName, categoryDescription, targetDomainName)
    })

    test('R-C-010 Navigate from the "Regression 1 Category" to the "Regression 2 Domain" through tag', async ({ page }) => {
        const categoryName = model.category1.name
        const categoryDescription = model.category1.description
        const sourceDomainName = model.domain1.name
        const sourceDomainDescription = model.domain1.description
        const targetDomainName = model.domain2.name
        const targetDomainDescription = model.domain2.description
        await zestPage.do.navigateToCategoryFromDomain(sourceDomainName, sourceDomainDescription, categoryName, categoryDescription)
        await zestPage.do.navigateToDomainFromCategoryTag(targetDomainName, targetDomainDescription)
    })

    test('R-C-011 Detach the "Regression 1 Category" from the "Regression 2 Domain"', async ({ page }) => {
        const categoryName = model.category1.name
        const categoryDescription = model.category1.description
        const sourceDomainName = model.domain1.name
        const sourceDomainDescription = model.domain1.description
        const targetDomainName = model.domain2.name
        await zestPage.do.navigateToCategoryFromDomain(sourceDomainName, sourceDomainDescription, categoryName, categoryDescription)
        await zestPage.do.detachCategoryFromDomain(categoryName, categoryDescription, targetDomainName)
    })

    test('R-T-001 Cretae a new thesis without statements in the "Regression 1 Category"', async ({ page }) => {
        const categoryName = model.category1.name
        const categoryDescription = model.category1.description
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const thesisText = model.thesis1.text
        const thesisNote = model.thesis1.note
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, categoryName, categoryDescription)
        if (await zestPage.check.thesisExists(thesisText)) {
            console.log(`Thesis "${thesisText}" already exists - skip test`)
            return;
        }
        await zestPage.do.openAddThesisEditor()
        await zestPage.do.createThesis(thesisText, thesisNote)
    })

    test('R-T-002 Create a new thesis with statements in the "Regression 1 Category"', async ({ page }) => {
        const categoryName = model.category1.name
        const categoryDescription = model.category1.description
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const thesisText = model.thesis2.text
        const thesisNote = model.thesis2.note
        const correctStatements = model.thesis2.correctStatements
        const incorrectStatements = model.thesis2.incorrectStatements
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, categoryName, categoryDescription)
        if (await zestPage.check.thesisExists(thesisText)) {
            console.log(`Thesis "${thesisText}" already exists - skip test`)
            return;
        }
        await zestPage.do.openAddThesisEditor()
        await zestPage.do.createThesis(thesisText, thesisNote, correctStatements, incorrectStatements)
        await zestPage.check.thesisStatementsAreVisible(correctStatements, incorrectStatements)
    })

    test('R-T-003 Cancel creating a new thesis in the "Regression 1 Category"', async ({ page }) => {
        const categoryName = model.category1.name
        const categoryDescription = model.category1.description
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const thesisText = model.thesis3.text
        const thesisNote = model.thesis3.note
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, categoryName, categoryDescription)
        await zestPage.do.openAddThesisEditor()
        await zestPage.do.cancelCreateThesis(thesisText, thesisNote)
    })

    test('R-T-004 Cancel editing the test thesis "Regression 1 New Thesis"', async () => {
        const categoryName = model.category1.name
        const categoryDescription = model.category1.description
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const thesisText = model.thesis1.text
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, categoryName, categoryDescription)
        const thesisRef = await zestPage.do.openEditThesisEditor(thesisText)
        await zestPage.do.cancelEditThesis(thesisRef, thesisText)
    })

    test('R-T-005 Edit and add statements to the test thesis "Regression 1 Thesis"', async ({ page }) => {
        const categoryName = model.category1.name
        const categoryDescription = model.category1.description
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const oldThesisText = model.category1.thesisText
        const newThesisText = model.category1.thesisTextEdited
        const newThesisNote = model.category1.thesisNoteEdited
        const correctStatements = model.category1.thesisCorrectStatements
        const incorrectStatements = model.category1.thesisIncorrectStatements
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, categoryName, categoryDescription)
        const thesisRef = await zestPage.do.openEditThesisEditor(oldThesisText)
        await zestPage.do.editThesis(thesisRef, newThesisText, newThesisNote, correctStatements, incorrectStatements)
        await zestPage.check.thesisStatementsAreVisible(correctStatements, incorrectStatements)
    })

    test('R-T-006 Edit statements of the test thesis "Regression 2 New Thesis"', async () => {
        const categoryName = model.category1.name
        const categoryDescription = model.category1.description
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const thesisText = model.thesis2.text
        const correctStatementsEdited = model.thesis2.correctStatementsEdited
        const incorrectStatementsEdited = model.thesis2.incorrectStatementsEdited
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, categoryName, categoryDescription)
        const thesisRef = await zestPage.do.openEditThesisEditor(thesisText)
        await zestPage.do.editThesisStatements(thesisRef, correctStatementsEdited, incorrectStatementsEdited)
        await zestPage.check.thesisStatementsAreVisible(correctStatementsEdited, incorrectStatementsEdited)
    })

    test('R-T-007 Create a new thesis with statements for deletion test in the "Regression 1 Category"', async () => {
        const categoryName = model.category1.name
        const categoryDescription = model.category1.description
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const thesisText = model.thesis4.text
        const thesisNote = model.thesis4.note
        const correctStatements = model.thesis4.correctStatements
        const incorrectStatements = model.thesis4.incorrectStatements
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, categoryName, categoryDescription)
        if (await zestPage.check.thesisExists(thesisText)) {
            console.log(`Thesis "${thesisText}" already exists - skip test`)
            return;
        }
        await zestPage.do.openAddThesisEditor()
        await zestPage.do.createThesis(thesisText, thesisNote, correctStatements, incorrectStatements)
        await zestPage.check.thesisStatementsAreVisible(correctStatements, incorrectStatements)
    })

    test('R-T-008 Delete statements from the test thesis "Regression 4 New Thesis"', async () => {
        const categoryName = model.category1.name
        const categoryDescription = model.category1.description
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const thesisText = model.thesis4.text
        const correctStatements = model.thesis4.correctStatements
        const incorrectStatements = model.thesis4.incorrectStatements
        const correctStatementsAfterDeletion = model.thesis4.correctStatementsAfterDeletion
        const incorrectStatementsAfterDeletion = model.thesis4.incorrectStatementsAfterDeletion
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, categoryName, categoryDescription)
        const thesisRef = await zestPage.do.openEditThesisEditor(thesisText)
        // Delete "Thesis 4 Correct B" and "Thesis 4 Incorrect E"
        const correctToDelete = correctStatements.filter(s => !correctStatementsAfterDeletion.includes(s))
        const incorrectToDelete = incorrectStatements.filter(s => !incorrectStatementsAfterDeletion.includes(s))
        await zestPage.do.deleteThesisStatements(thesisRef, correctToDelete, incorrectToDelete)
        await zestPage.check.thesisStatementsAreVisible(correctStatementsAfterDeletion, incorrectStatementsAfterDeletion)
    })

    test('R-T-009 Create a new thesis with statements for complete deletion test in the "Regression 1 Category"', async () => {
        const categoryName = model.category1.name
        const categoryDescription = model.category1.description
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const thesisText = model.thesis5.text
        const thesisNote = model.thesis5.note
        const correctStatements = model.thesis5.correctStatements
        const incorrectStatements = model.thesis5.incorrectStatements
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, categoryName, categoryDescription)
        if (await zestPage.check.thesisExists(thesisText)) {
            console.log(`Thesis "${thesisText}" already exists - skip test`)
            return;
        }
        await zestPage.do.openAddThesisEditor()
        await zestPage.do.createThesis(thesisText, thesisNote, correctStatements, incorrectStatements)
        await zestPage.check.thesisStatementsAreVisible(correctStatements, incorrectStatements)
    })

    test('R-T-010 Remove all statements from the test thesis "Regression 5 New Thesis"', async () => {
        const categoryName = model.category1.name
        const categoryDescription = model.category1.description
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const thesisText = model.thesis5.text
        const correctStatements = model.thesis5.correctStatements
        const incorrectStatements = model.thesis5.incorrectStatements
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, categoryName, categoryDescription)
        const thesisRef = await zestPage.do.openEditThesisEditor(thesisText)
        await zestPage.do.removeAllThesisStatements(thesisRef)
        await zestPage.check.thesisStatementsAreNotVisible(correctStatements, incorrectStatements)
    })

    test('R-T-011 Attach the test thesis "Regression 1 New Thesis" to the "Regression 2 Category"', async () => {
        const categoryName = model.category1.name
        const categoryDescription = model.category1.description
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const thesisText = model.thesis1.text
        const targetCategoryName = model.category2.name
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, categoryName, categoryDescription)
        const thesisRef = await zestPage.do.openEditThesisEditor(thesisText)
        await zestPage.do.attachThesisToCategory(thesisRef, targetCategoryName)
        // Verify category is visible in thesis note
        await zestPage.do.showThesisNote(thesisRef)
        await zestPage.check.thesisCategoryIsVisibleInNote(thesisRef, categoryName)
        await zestPage.check.thesisCategoryIsVisibleInNote(thesisRef, targetCategoryName)
        await zestPage.do.hideThesisNote(thesisRef)
    })

    test('R-T-012 Verify the test thesis "Regression 1 New Thesis" is visible in the "Regression 2 Category"', async () => {
        const categoryName = model.category2.name
        const categoryDescription = model.category2.description
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const thesisText = model.thesis1.text
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, categoryName, categoryDescription)
        expect(await zestPage.check.thesisExists(thesisText)).toBeTruthy()
    })

    test('R-T-013 Detach the test thesis "Regression 1 New Thesis" from the "Regression 2 Category"', async () => {
        const categoryName = model.category1.name
        const categoryDescription = model.category1.description
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const thesisText = model.thesis1.text
        const targetCategoryName = model.category2.name
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, categoryName, categoryDescription)
        const thesisRef = await zestPage.do.openEditThesisEditor(thesisText)
        await zestPage.do.detachThesisFromCategory(thesisRef, targetCategoryName)
        // Verify category is visible in thesis note
        await zestPage.do.showThesisNote(thesisRef)
        await zestPage.check.thesisCategoryIsVisibleInNote(thesisRef, categoryName)
        await zestPage.check.thesisCategoryIsNotVisibleInNote(thesisRef, targetCategoryName)
        await zestPage.do.hideThesisNote(thesisRef)
    })

    test('R-T-014 Verify the test thesis "Regression 1 New Thesis" is not visible in the "Regression 2 Category" after detachment', async () => {
        const categoryName = model.category2.name
        const categoryDescription = model.category2.description
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const thesisText = model.thesis1.text
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, categoryName, categoryDescription)
        expect(await zestPage.check.thesisExists(thesisText)).toBeFalsy()
    })

    test('R-T-015 Create a test thesis "Regression 6 New Thesis" for deletion test', async () => {
        const categoryName = model.category1.name
        const categoryDescription = model.category1.description
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const thesisText = model.thesis6.text
        const thesisNote = model.thesis6.note
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, categoryName, categoryDescription)
        if (await zestPage.check.thesisExists(thesisText)) {
            console.log(`Thesis "${thesisText}" already exists - skip test`)
            return;
        }
        await zestPage.do.openAddThesisEditor()
        await zestPage.do.createThesis(thesisText, thesisNote)
    })

    test('R-T-016 Delete the test thesis "Regression 6 New Thesis"', async () => {
        const categoryName = model.category1.name
        const categoryDescription = model.category1.description
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const thesisText = model.thesis6.text
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, categoryName, categoryDescription)
        await zestPage.do.deleteThesis(thesisText)
        expect(await zestPage.check.thesisExists(thesisText)).toBeFalsy()
    })

    test('R-C-012 Create "Regression 4 Category" with shared thesis for deletion test', async () => {
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const categoryName = model.category4.name
        const categoryDescription = model.category4.description
        const thesisText = model.thesis7.text
        const thesisNote = model.thesis7.note
        await zestPage.do.navigateToDomain(domainName, domainDescription)
        if (await zestPage.check.categoryExists(categoryName)) {
            console.log(`Category "${categoryName}" already exists - skip test`)
            return;
        }
        await zestPage.do.createTestCategory(categoryName, categoryDescription, thesisText, thesisNote)
        await zestPage.check.categoryExistsInDomainList(categoryName)
    })

    test('R-C-013 Attach thesis "Regression 7 Shared Thesis" to "Regression 1 Category"', async () => {
        const categoryName = model.category4.name
        const categoryDescription = model.category4.description
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const thesisText = model.thesis7.text
        const targetCategoryName = model.category1.name
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, categoryName, categoryDescription)
        const thesisRef = await zestPage.do.openEditThesisEditor(thesisText)
        await zestPage.do.attachThesisToCategory(thesisRef, targetCategoryName)
    })

    test('R-C-014 Verify "Regression 7 Shared Thesis" is visible in both categories', async () => {
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const thesisText = model.thesis7.text
        // Check in category1
        const category1Name = model.category1.name
        const category1Description = model.category1.description
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, category1Name, category1Description)
        expect(await zestPage.check.thesisExists(thesisText)).toBeTruthy()
        // Check in category4
        const category4Name = model.category4.name
        const category4Description = model.category4.description
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, category4Name, category4Description)
        expect(await zestPage.check.thesisExists(thesisText)).toBeTruthy()
    })

    test('R-C-015 Delete "Regression 4 Category" with multi-linked thesis (thesis should remain)', async () => {
        const categoryName = model.category4.name
        const categoryDescription = model.category4.description
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const thesisText = model.thesis7.text
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, categoryName, categoryDescription)
        await zestPage.do.deleteCategory(categoryName)
        // Verify category is deleted
        await zestPage.do.navigateToDomain(domainName, domainDescription)
        expect(await zestPage.check.categoryExists(categoryName)).toBeFalsy()
        // Verify thesis still exists in category1
        const category1Name = model.category1.name
        const category1Description = model.category1.description
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, category1Name, category1Description)
        expect(await zestPage.check.thesisExists(thesisText)).toBeTruthy()
    })

    test('R-C-016 Create "Regression 5 Category" with single thesis for deletion test', async () => {
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const categoryName = model.category5.name
        const categoryDescription = model.category5.description
        const thesisText = model.thesis8.text
        const thesisNote = model.thesis8.note
        await zestPage.do.navigateToDomain(domainName, domainDescription)
        if (await zestPage.check.categoryExists(categoryName)) {
            console.log(`Category "${categoryName}" already exists - skip test`)
            return;
        }
        await zestPage.do.createTestCategory(categoryName, categoryDescription, thesisText, thesisNote)
        await zestPage.check.categoryExistsInDomainList(categoryName)
    })

    test('R-C-017 Delete "Regression 5 Category" with single-linked thesis (both should be deleted)', async () => {
        const categoryName = model.category5.name
        const categoryDescription = model.category5.description
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const thesisText = model.thesis8.text
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, categoryName, categoryDescription)
        // Verify thesis exists before deletion
        expect(await zestPage.check.thesisExists(thesisText)).toBeTruthy()
        await zestPage.do.deleteCategory(categoryName)
        // Verify category is deleted
        await zestPage.do.navigateToDomain(domainName, domainDescription)
        expect(await zestPage.check.categoryExists(categoryName)).toBeFalsy()
        // Verify thesis is also deleted (should not exist in any category)
        const category1Name = model.category1.name
        const category1Description = model.category1.description
        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, category1Name, category1Description)
        expect(await zestPage.check.thesisExists(thesisText)).toBeFalsy()
    })

    // ========== Cleanup tests: Delete all remaining test data ==========

    test('R-CLEANUP-001 Delete remaining theses from "Regression 1 Category"', async () => {
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const categoryName = model.category1.name
        const categoryDescription = model.category1.description

        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, categoryName, categoryDescription)

        // Delete thesis7 (shared thesis)
        const thesis7Text = model.thesis7.text
        if (await zestPage.check.thesisExists(thesis7Text)) {
            await zestPage.do.deleteThesis(thesis7Text)
            expect(await zestPage.check.thesisExists(thesis7Text)).toBeFalsy()
        }

        // Delete thesis5
        const thesis5Text = model.thesis5.text
        if (await zestPage.check.thesisExists(thesis5Text)) {
            await zestPage.do.deleteThesis(thesis5Text)
            expect(await zestPage.check.thesisExists(thesis5Text)).toBeFalsy()
        }

        // Delete thesis4
        const thesis4Text = model.thesis4.text
        if (await zestPage.check.thesisExists(thesis4Text)) {
            await zestPage.do.deleteThesis(thesis4Text)
            expect(await zestPage.check.thesisExists(thesis4Text)).toBeFalsy()
        }

        // Delete thesis2
        const thesis2Text = model.thesis2.text
        if (await zestPage.check.thesisExists(thesis2Text)) {
            await zestPage.do.deleteThesis(thesis2Text)
            expect(await zestPage.check.thesisExists(thesis2Text)).toBeFalsy()
        }

        // Delete thesis1
        const thesis1Text = model.thesis1.text
        if (await zestPage.check.thesisExists(thesis1Text)) {
            await zestPage.do.deleteThesis(thesis1Text)
            expect(await zestPage.check.thesisExists(thesis1Text)).toBeFalsy()
        }

        // Delete original category1 thesis
        const category1ThesisText = model.category1.thesisText
        if (await zestPage.check.thesisExists(category1ThesisText)) {
            await zestPage.do.deleteThesis(category1ThesisText)
            expect(await zestPage.check.thesisExists(category1ThesisText)).toBeFalsy()
        }
    })

    test('R-CLEANUP-002 Delete "Regression 1 Category"', async () => {
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const categoryName = model.category1.name
        const categoryDescription = model.category1.description

        await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, categoryName, categoryDescription)
        await zestPage.do.deleteCategory(categoryName)

        // Verify category is deleted
        await zestPage.do.navigateToDomain(domainName, domainDescription)
        expect(await zestPage.check.categoryExists(categoryName)).toBeFalsy()
    })

    test('R-CLEANUP-003 Delete "Regression 2 Category"', async () => {
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description
        const categoryName = model.category2.name
        const categoryDescription = model.category2.description

        await zestPage.do.navigateToDomain(domainName, domainDescription)

        if (await zestPage.check.categoryExists(categoryName)) {
            await zestPage.do.navigateToCategoryFromDomain(domainName, domainDescription, categoryName, categoryDescription)
            await zestPage.do.deleteCategory(categoryName)

            // Verify category is deleted
            await zestPage.do.navigateToDomain(domainName, domainDescription)
            expect(await zestPage.check.categoryExists(categoryName)).toBeFalsy()
        }
    })

    test('R-CLEANUP-004 Delete "Regression 1 Domain"', async () => {
        const domainName = model.domain1.name
        const domainDescription = model.domain1.description

        await zestPage.do.navigateToZestHome()

        if (await zestPage.check.domainExists(domainName)) {
            await zestPage.do.navigateToDomain(domainName, domainDescription)
            await zestPage.do.deleteDomain(domainName)

            // Verify domain is deleted
            await zestPage.do.navigateToZestHome()
            expect(await zestPage.check.domainExists(domainName)).toBeFalsy()
        }
    })

    test('R-CLEANUP-005 Delete "Regression 2 Domain"', async () => {
        const domainName = model.domain2.name
        const domainDescription = model.domain2.description

        await zestPage.do.navigateToZestHome()

        if (await zestPage.check.domainExists(domainName)) {
            await zestPage.do.navigateToDomain(domainName, domainDescription)
            await zestPage.do.deleteDomain(domainName)

            // Verify domain is deleted
            await zestPage.do.navigateToZestHome()
            expect(await zestPage.check.domainExists(domainName)).toBeFalsy()
        }
    })

    test('R-CLEANUP-006 Delete "Regression 3 Domain Edited"', async () => {
        const domainName = model.domain3Edited.name
        const domainDescription = model.domain3Edited.description

        await zestPage.do.navigateToZestHome()

        if (await zestPage.check.domainExists(domainName)) {
            await zestPage.do.navigateToDomain(domainName, domainDescription)
            await zestPage.do.deleteDomain(domainName)

            // Verify domain is deleted
            await zestPage.do.navigateToZestHome()
            expect(await zestPage.check.domainExists(domainName)).toBeFalsy()
        }
    })

});