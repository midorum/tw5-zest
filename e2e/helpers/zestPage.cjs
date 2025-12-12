const { expect } = require('@playwright/test')
const { constants, locators, log } = require('./utils')

class ZestPage {
    constructor(page) {
        this.page = page;
        this.locator = new Locator(page);
        this.log = new Log(page);
        this.check = new Check(page, this.locator, this.log);
        this.do = new Do(page, this.locator, this.check, this.log);
    }
}

class Locator {
    constructor(page) {
        this.page = page;
    }

    invisibleButton(text) {
        return this.page.locator(locators.invisibleButton).getByText('[Add Domain]', { exact: true })
    }

}

class Log {
    constructor(page) {
        this.page = page;
    }

    async innerText(locator) {
        if (await locator.isVisible({ timeout: 5000 }).catch(() => false)) {
            const text = await locator.innerText();
            console.log('>', locator, ':', text);
        }
    }

    async innerHTML(locator) {
        if (await locator.isVisible({ timeout: 5000 }).catch(() => false)) {
            const html = await locator.evaluate(node => node.innerHTML);
            console.log('>', locator, ':', html);
        }
    }

    async outerHTML(locator) {
        if (await locator.isVisible({ timeout: 5000 }).catch(() => false)) {
            const html = await locator.evaluate(node => node.outerHTML);
            console.log('>', locator, ':', html);
        }
    }

    async attributes(locator) {
        console.log(locator, ':', await this.page.locator(locator).evaluate(node => Object.fromEntries([...node.attributes].map(a => [a.name, a.value]))))
    }

    async inputValue(locator) {
        console.log(locator, ':', await this.page.locator(locator).inputValue())
    }

    async takeShot() {
        await this.page.screenshot({ path: `debug-screenshot-${new Date().getTime()}.png` })
    }
}

class Check {
    constructor(page, locator, log) {
        this.page = page;
        this.locator = locator;
        this.log = log;
    }

    async currentTiddlerIs(title) {
        await expect(this.page.locator(locators.currentDomainAttr.replace('${title}', title))).toBeVisible();
        await expect(this.page.locator(locators.currentDomainTitle.replace('${title}', title))).toBeVisible();
    }

    async domainExists(domainName) {
        const b = this.page.locator(locators.navigateToDomainButton.replace('${domainName}', domainName))
        const bb = await b.isVisible()
        // await this.log.outerHTML(b)
        const c = this.page.locator(locators.startLearningDomainButton.replace('${domainName}', domainName))
        const cc = await c.isVisible()
        // await this.log.outerHTML(c)
        return bb && cc;
    }

    async addDomainEditorIsOpened() {
        await expect(this.page.locator(locators.addDomainButton)).not.toBeVisible();
        await expect(this.page.locator(locators.addDomainNameInput)).toBeVisible();
        await expect(this.page.locator(locators.addDomainDescriptionInput)).toBeVisible();
        await expect(this.page.locator(locators.createDomainButton)).toBeVisible();
        await expect(this.page.locator(locators.cancelCreateDomainButton)).toBeVisible();
    }

    async addDomainEditorIsClosed() {
        await expect(this.page.locator(locators.addDomainButton)).toBeVisible();
        // await expect(this.locator.invisibleButton('[Add Domain]')).toBeVisible();
        await expect(this.page.locator(locators.addDomainNameInput)).not.toBeVisible();
        await expect(this.page.locator(locators.addDomainDescriptionInput)).not.toBeVisible();
        await expect(this.page.locator(locators.createDomainButton)).not.toBeVisible();
        await expect(this.page.locator(locators.cancelCreateDomainButton)).not.toBeVisible();
    }

    async domainEditorIsOpened(name, description) {
        await expect(this.page.locator(locators.editDomainButton)).not.toBeVisible();
        await expect(this.page.locator(locators.domainNameInput)).toBeVisible();
        // await this.log.inputValue(locators.domainNameInput)
        await expect(this.page.locator(locators.domainNameInput)).toHaveValue(name);
        await expect(this.page.locator(locators.domainDescriptionInput)).toBeVisible();
        await expect(this.page.locator(locators.domainDescriptionInput)).toHaveValue(description);
        await expect(this.page.locator(locators.saveDomainButton)).toBeVisible();
        await expect(this.page.locator(locators.cancelEditDomainButton)).toBeVisible();
    }

    async domainEditorIsClosed(name, description) {
        const dn = this.page.locator(locators.domainNameView.replace('${text}', name))
        await expect(dn).toBeVisible()
        // await this.log.outerHTML(dn)
        // await this.log.outerHTML(this.page.locator('.zest-domain-name'))
        await expect(this.page.locator(locators.domainDescriptionView.replace('${text}', description))).toBeVisible()
        await expect(this.page.locator(locators.editDomainButton)).toBeVisible();
        await expect(this.page.locator(locators.domainNameInput)).not.toBeVisible();
        await expect(this.page.locator(locators.domainDescriptionInput)).not.toBeVisible();
        await expect(this.page.locator(locators.saveDomainButton)).not.toBeVisible();
        await expect(this.page.locator(locators.cancelEditDomainButton)).not.toBeVisible();
    }

    async domainFormInViewMode(name, description) {
        await this.domainEditorIsClosed(name, description)
        await expect(this.page.locator(locators.addCategoryButton)).toBeVisible()
        await expect(this.page.locator(locators.deleteDomainButton)).toBeVisible()
    }

    async addCategoryEditorIsOpened() {
        await expect(this.page.locator(locators.addCategoryButton)).not.toBeVisible();
        await expect(this.page.locator(locators.addCategoryNameInput)).toBeVisible();
        await expect(this.page.locator(locators.addCategoryDescriptionInput)).toBeVisible();
        await expect(this.page.locator(locators.addCategoryThesisTextInput)).toBeVisible();
        await expect(this.page.locator(locators.createCategoryButton)).toBeVisible();
        await expect(this.page.locator(locators.cancelCreateCategoryButton)).toBeVisible();
    }

    async addCategoryEditorIsClosed() {
        await expect(this.page.locator(locators.addCategoryButton)).toBeVisible();
        await expect(this.page.locator(locators.addCategoryNameInput)).not.toBeVisible();
        await expect(this.page.locator(locators.addCategoryDescriptionInput)).not.toBeVisible();
        await expect(this.page.locator(locators.addCategoryThesisTextInput)).not.toBeVisible();
        await expect(this.page.locator(locators.createCategoryButton)).not.toBeVisible();
        await expect(this.page.locator(locators.cancelCreateCategoryButton)).not.toBeVisible();
    }

    async categoryExistsInDomainList(categoryName) {
        const categoryButton = this.page.locator(locators.domainCategoryButton.replace('${categoryName}', categoryName));
        await expect(categoryButton).toBeVisible();
    }

    async thesisStatementsAreVisible(correctStatements, incorrectStatements) {
        if (correctStatements) {
            for (let s of correctStatements) {
                await expect(this.page.locator(`text=${s}`)).toBeVisible();
            }
        }
        if (incorrectStatements) {
            for (let s of incorrectStatements) {
                await expect(this.page.locator(`text=${s}`)).toBeVisible();
            }
        }
    }

    async thesisStatementsAreNotVisible(correctStatements, incorrectStatements) {
        if (correctStatements) {
            for (let s of correctStatements) {
                await expect(this.page.locator(`text=${s}`)).not.toBeVisible();
            }
        }
        if (incorrectStatements) {
            for (let s of incorrectStatements) {
                await expect(this.page.locator(`text=${s}`)).not.toBeVisible();
            }
        }
    }

    async categoryExists(categoryName) {
        const categoryButton = this.page.locator(locators.domainCategoryButton.replace('${categoryName}', categoryName));
        return await categoryButton.first().isVisible();
    }

    async thesisExists(thesisText) {
        const thesis = this.page.locator(locators.thesisText.replace('${text}', thesisText));
        return await thesis.first().isVisible();
    }

    async categoryFormInViewMode(name, description) {
        const cn = this.page.locator(locators.categoryNameView.replace('${text}', name))
        await expect(cn).toBeVisible()
        await expect(this.page.locator(locators.categoryDescriptionView.replace('${text}', description))).toBeVisible()
        await expect(this.page.locator(locators.thesesHeader)).toBeVisible()
        await expect(this.page.locator(locators.addThesisButton)).toBeVisible()
        await expect(this.page.locator(locators.deleteCategoryButton)).toBeVisible()
    }

    async categoryEditorIsOpened(name, description) {
        await expect(this.page.locator(locators.editCategoryButton)).not.toBeVisible();
        await expect(this.page.locator(locators.categoryNameInput)).toBeVisible();
        await expect(this.page.locator(locators.categoryNameInput)).toHaveValue(name);
        await expect(this.page.locator(locators.categoryDescriptionInput)).toBeVisible();
        await expect(this.page.locator(locators.categoryDescriptionInput)).toHaveValue(description);
        await expect(this.page.locator(locators.saveCategoryButton)).toBeVisible();
        await expect(this.page.locator(locators.cancelEditCategoryButton)).toBeVisible();
    }

    async categoryEditorIsClosed(name, description) {
        const cn = this.page.locator(locators.categoryNameView.replace('${text}', name))
        await expect(cn).toBeVisible()
        await expect(this.page.locator(locators.categoryDescriptionView.replace('${text}', description))).toBeVisible()
        await expect(this.page.locator(locators.editCategoryButton)).toBeVisible();
        await expect(this.page.locator(locators.categoryNameInput)).not.toBeVisible();
        await expect(this.page.locator(locators.categoryDescriptionInput)).not.toBeVisible();
        await expect(this.page.locator(locators.saveCategoryButton)).not.toBeVisible();
        await expect(this.page.locator(locators.cancelEditCategoryButton)).not.toBeVisible();
    }

    async categoryIsLinkedToDomain(domainName) {
        const linkedDomainTag = this.page.locator(locators.linkedDomainTag.replace('${domainName}', domainName));
        await expect(linkedDomainTag).toBeVisible();
    }

    async categoryIsNotLinkedToDomain(domainName) {
        const linkedDomainTag = this.page.locator(locators.linkedDomainTag.replace('${domainName}', domainName));
        await expect(linkedDomainTag).not.toBeVisible();
    }

    async thesisIsLinkedToCategory(thesisRef, categoryName) {
        const form = this.page.locator(locators.thesisEditForm.replace('${thesisRef}', thesisRef));
        const linkedCategoryTag = form.locator(locators.linkedCategoryTag.replace('${categoryName}', categoryName));
        await expect(linkedCategoryTag).toBeVisible();
    }

    async thesisIsNotLinkedToCategory(thesisRef, categoryName) {
        const form = this.page.locator(locators.thesisEditForm.replace('${thesisRef}', thesisRef));
        const linkedCategoryTag = form.locator(locators.linkedCategoryTag.replace('${categoryName}', categoryName));
        await expect(linkedCategoryTag).not.toBeVisible();
    }

    async thesisNoteIsVisible(thesisRef) {
        const container = this.page.locator(locators.thesisContainer.replace('${thesisRef}', thesisRef));
        const noteText = container.locator(locators.thesisNoteText);
        await expect(noteText).toBeVisible();
    }

    async thesisNoteIsNotVisible(thesisRef) {
        const container = this.page.locator(locators.thesisContainer.replace('${thesisRef}', thesisRef));
        const noteText = container.locator(locators.thesisNoteText);
        await expect(noteText).not.toBeVisible();
    }

    async thesisCategoryIsVisibleInNote(thesisRef, categoryName) {
        const container = this.page.locator(locators.thesisContainer.replace('${thesisRef}', thesisRef));
        const categoryTag = container.locator(locators.thesisNoteCategoryTag.replace('${categoryName}', categoryName));
        await expect(categoryTag).toBeVisible();
    }

    async thesisCategoryIsNotVisibleInNote(thesisRef, categoryName) {
        const container = this.page.locator(locators.thesisContainer.replace('${thesisRef}', thesisRef));
        const categoryTag = container.locator(locators.thesisNoteCategoryTag.replace('${categoryName}', categoryName));
        await expect(categoryTag).not.toBeVisible();
    }

    async deleteCategoryConfirmFormIsOpened() {
        await expect(this.page.locator(locators.deleteCategoryButton)).not.toBeVisible();
        await expect(this.page.locator(locators.deleteCategoryConfirmInput)).toBeVisible();
        await expect(this.page.locator(locators.deleteCategoryConfirmButton)).toBeVisible();
        await expect(this.page.locator(locators.cancelDeleteCategoryButton)).toBeVisible();
    }

    async deleteCategoryConfirmFormIsClosed() {
        await expect(this.page.locator(locators.deleteCategoryButton)).toBeVisible();
        await expect(this.page.locator(locators.deleteCategoryConfirmInput)).not.toBeVisible();
        await expect(this.page.locator(locators.deleteCategoryConfirmButton)).not.toBeVisible();
        await expect(this.page.locator(locators.cancelDeleteCategoryButton)).not.toBeVisible();
    }

    async addThesisEditorIsOpened() {
        await expect(this.page.locator(locators.addThesisButton)).not.toBeVisible();
        await expect(this.page.locator(locators.thesisTextInput)).toBeVisible();
        await expect(this.page.locator(locators.thesisNoteInput)).toBeVisible();
        await expect(this.page.locator(locators.createThesisButton)).toBeVisible();
        await expect(this.page.locator(locators.cancelCreateThesisButton)).toBeVisible();
    }

    async addThesisEditorIsClosed() {
        await expect(this.page.locator(locators.addThesisButton)).toBeVisible();
        await expect(this.page.locator(locators.thesisTextInput)).not.toBeVisible();
        await expect(this.page.locator(locators.thesisNoteInput)).not.toBeVisible();
        await expect(this.page.locator(locators.createThesisButton)).not.toBeVisible();
        await expect(this.page.locator(locators.cancelCreateThesisButton)).not.toBeVisible();
    }

    async editThesisEditorIsOpened(thesisRef) {
        const form = this.page.locator(locators.thesisEditForm.replace('${thesisRef}', thesisRef));
        await expect(form).toBeVisible();
        await expect(form.locator(locators.editThesisTextInput)).toBeVisible();
        await expect(form.locator(locators.editThesisNoteInput)).toBeVisible();
        await expect(form.locator(locators.saveThesisButton)).toBeVisible();
        await expect(form.locator(locators.cancelEditThesisButton)).toBeVisible();
    }

    async editThesisEditorIsClosed(thesisRef) {
        const form = this.page.locator(locators.thesisEditForm.replace('${thesisRef}', thesisRef));
        await expect(form).not.toBeVisible();
    }

}

class Do {
    constructor(page, locator, check, log) {
        this.page = page;
        this.locator = locator;
        this.check = check;
        this.log = log;
    }

    async openInitialTiddler() {
        await this.page.goto('/');
        await this.page.waitForFunction(() => !!window.$tw?.wiki, { timeout: 15000 });
        await expect(this.page).toHaveTitle(/tw5-zest — Mastering your knowledge!/, { timeout: 20000 });
        await expect(this.page.locator(locators.storyRiver)).toBeVisible();
        await this.check.currentTiddlerIs('Hello from Zest!');
    }

    async navigateToZestHome() {
        const title = 'Zest Home';
        await this.openInitialTiddler();
        const link = this.page.locator(`a[href="#${title.replaceAll(' ', '%20')}"]:has-text("this")`);
        await expect(link).toBeVisible();
        await link.click();
        await this.check.currentTiddlerIs(title);
        await this.check.addDomainEditorIsClosed();
    }

    async openAddDomainEditor() {
        await this.page.locator(locators.addDomainButton).click();
        await this.check.addDomainEditorIsOpened()
    }

    async createTestDomain(name, description) {
        await this.openAddDomainEditor();
        await this.page.locator(locators.addDomainNameInput).fill(name);
        await this.page.locator(locators.addDomainDescriptionInput).fill(description);
        await this.page.locator(locators.createDomainButton).click();
        await this.check.addDomainEditorIsClosed();
        expect(await this.check.domainExists(name)).toBeTruthy();
    }

    async cancelDomainCreation(name, description) {
        await this.openAddDomainEditor();
        await this.page.locator(locators.addDomainNameInput).fill(name);
        await this.page.locator(locators.addDomainDescriptionInput).fill(description);
        await this.page.locator(locators.cancelCreateDomainButton).click();
        await this.check.addDomainEditorIsClosed();
        expect(await this.check.domainExists(name)).toBeFalsy();
    }

    async navigateToDomainForm(domainName) {
        const navigateButton = this.page.locator(locators.navigateToDomainButton.replace('${domainName}', domainName))
        await navigateButton.isVisible()
        await navigateButton.click()
        await this.check.currentTiddlerIs('Domain');
    }

    async navigateToDomain(domainName, domainDescription) {
        await this.navigateToZestHome()
        if (! await this.check.domainExists(domainName)) {
            console.log(`Domain "${domainName}" does not exist - skip test`)
            return;
        }
        await this.navigateToDomainForm(domainName)
        await this.check.domainFormInViewMode(domainName, domainDescription)
    }

    async openDomainEditor(name, description) {
        await this.page.locator(locators.editDomainButton).click();
        await this.check.domainEditorIsOpened(name, description)
    }

    async editDomain(oldName, oldDescription, newName, newDescription) {
        await this.openDomainEditor(oldName, oldDescription)
        await this.page.locator(locators.domainNameInput).fill(newName);
        await this.page.locator(locators.domainDescriptionInput).fill(newDescription);
        await this.page.locator(locators.saveDomainButton).click();
        await this.check.domainEditorIsClosed(newName, newDescription);
        // await this.log.takeShot();
    }

    async cancelEditDomain(name, description) {
        await this.openDomainEditor(name, description)
        await this.page.locator(locators.domainNameInput).fill('Modified Name (cancelled)');
        await this.page.locator(locators.domainDescriptionInput).fill('Modified Description (cancelled)');
        await this.page.locator(locators.cancelEditDomainButton).click();
        await this.check.domainEditorIsClosed(name, description);
    }

    async deleteDomain(name) {
        const dialogPromise = new Promise((resolve) => {
            this.page.once('dialog', async (dialog) => {
                expect(dialog.type()).toBe('confirm');
                expect(dialog.message()).toBe(locators.deleteDomainModalText);
                await dialog.accept();
                resolve();
            });
        });
        const b = this.page.locator(locators.deleteDomainButton);
        await expect(b).toBeVisible();
        await b.click();
        await dialogPromise;
        await this.check.currentTiddlerIs('Zest Home');

        // Wait for domain button to be removed from DOM
        const domainButton = this.page.locator(locators.navigateToDomainButton.replace('${domainName}', name));
        await expect(domainButton).not.toBeVisible();

        expect(await this.check.domainExists(name)).toBeFalsy()
    }

    async failToDeleteDomainWithLinkedCategories(name) {
        const dialogPromise = new Promise((resolve) => {
            this.page.once('dialog', async (dialog) => {
                expect(dialog.type()).toBe('confirm');
                expect(dialog.message()).toBe(locators.deleteDomainModalText);
                await dialog.accept();
                resolve();
            });
        });
        const b = this.page.locator(locators.deleteDomainButton);
        await expect(b).toBeVisible();
        await b.click();
        await dialogPromise;
        // Should show error alert
        const errorAlert = this.page.locator(locators.errorAlertCannotDeleteDomain);
        await expect(errorAlert).toBeVisible({ timeout: 15000 });
        // Still on the same domain page
        await this.check.currentTiddlerIs('Domain');
        // Domain should still exist
        await this.navigateToZestHome();
        expect(await this.check.domainExists(name)).toBeTruthy()
    }

    async openAddCategoryEditor() {
        await this.page.locator(locators.addCategoryButton).click();
        await this.check.addCategoryEditorIsOpened()
    }

    async createTestCategory(name, description, thesisText, thesisNote, correctStatements, incorrectStatements) {
        await this.openAddCategoryEditor();
        await this.page.locator(locators.addCategoryNameInput).fill(name);
        await this.page.locator(locators.addCategoryDescriptionInput).fill(description);
        if (thesisText) {
            await this.page.locator(locators.addCategoryThesisTextInput).fill(thesisText);
            if (thesisNote) {
                await this.page.locator(locators.addCategoryThesisNoteInput).fill(thesisNote);
            }
            if (correctStatements || incorrectStatements) {
                await this.page.locator(locators.thesisContainsStatementsRadio).click();
                const css = this.page.locator(locators.thesisCorrectStatementInputSection)
                await expect(css).toBeVisible();
                // await this.log.outerHTML(css)
                const iss = this.page.locator(locators.thesisIncorrectStatementInputSection)
                await expect(iss).toBeVisible();
                // await this.log.outerHTML(iss)
                if (correctStatements) {
                    const si = this.page.locator(locators.thesisCorrectStatementInput)
                    await si.first().waitFor({ state: 'visible' })
                    for (let i = 0; i < correctStatements.length; i++) {
                        if (i > 0) await this.page.locator(locators.thesisAddAnotherCorrectButton).click()
                        await si.nth(i).waitFor({ state: 'visible' })
                        await si.nth(i).fill(correctStatements[i])
                    }
                }
                if (incorrectStatements) {
                    const si = this.page.locator(locators.thesisIncorrectStatementInput)
                    await si.first().waitFor({ state: 'visible' })
                    for (let i = 0; i < incorrectStatements.length; i++) {
                        if (i > 0) await this.page.locator(locators.thesisAddAnotherIncorrectButton).click()
                        await si.nth(i).waitFor({ state: 'visible' })
                        await si.nth(i).fill(incorrectStatements[i])
                    }
                }
            }
        }
        await this.page.locator(locators.createCategoryButton).click();
        await this.check.addCategoryEditorIsClosed();
    }

    async navigateToCategory(categoryName) {
        const categoryButton = this.page.locator(locators.domainCategoryButton.replace('${categoryName}', categoryName));
        await expect(categoryButton).toBeVisible();
        await categoryButton.click();
        await expect(this.page.locator(locators.thesesHeader)).toBeVisible();
    }

    async navigateToCategoryFromDomain(domainName, domainDescription, categoryName, categoryDescription) {
        await this.navigateToDomain(domainName, domainDescription)
        if (! await this.check.categoryExists(categoryName)) {
            console.log(`Category "${categoryName}" does not exist - skip test`)
            return;
        }
        await this.navigateToCategory(categoryName)
        await this.check.currentTiddlerIs('Category');
        await this.check.categoryFormInViewMode(categoryName, categoryDescription)
    }

    async openCategoryEditor(name, description) {
        await this.page.locator(locators.editCategoryButton).click();
        await this.check.categoryEditorIsOpened(name, description)
    }

    async editCategory(oldName, oldDescription, newName, newDescription) {
        await this.openCategoryEditor(oldName, oldDescription)
        await this.page.locator(locators.categoryNameInput).fill(newName);
        await this.page.locator(locators.categoryDescriptionInput).fill(newDescription);
        await this.page.locator(locators.saveCategoryButton).click();
        await this.check.categoryEditorIsClosed(newName, newDescription);
    }

    async cancelEditCategory(name, description) {
        await this.openCategoryEditor(name, description)
        await this.page.locator(locators.categoryNameInput).fill('Modified Name (cancelled)');
        await this.page.locator(locators.categoryDescriptionInput).fill('Modified Description (cancelled)');
        await this.page.locator(locators.cancelEditCategoryButton).click();
        await this.check.categoryEditorIsClosed(name, description);
    }

    async _openDeleteCategoryConfirmForm(phrase) {
        await this.page.locator(locators.deleteCategoryButton).click();
        await this.check.deleteCategoryConfirmFormIsOpened();
        await this.page.locator(locators.deleteCategoryConfirmInput).fill(phrase);
    }

    _setupDialogHandler(shouldAccept) {
        const state = { dialogAppeared: false };
        const dialogPromise = new Promise((resolve) => {
            this.page.once('dialog', async (dialog) => {
                state.dialogAppeared = true;
                expect(dialog.type()).toBe('confirm');
                expect(dialog.message()).toBe(locators.deleteCategoryModalText);
                if (shouldAccept) {
                    await dialog.accept();
                } else {
                    await dialog.dismiss();
                }
                resolve();
            });
        });
        return { state, dialogPromise };
    }

    async deleteCategory(categoryName) {
        const { dialogPromise } = this._setupDialogHandler(true);
        await this._openDeleteCategoryConfirmForm(constants.deleteConfirmationPhrase);
        await this.page.locator(locators.deleteCategoryConfirmButton).click();
        await dialogPromise;
        await this.check.currentTiddlerIs('Domain');
        const categoryButton = this.page.locator(locators.domainCategoryButton.replace('${categoryName}', categoryName));
        await expect(categoryButton).not.toBeVisible();
        expect(await this.check.categoryExists(categoryName)).toBeFalsy()
    }

    async failToDeleteCategoryWithWrongPhrase(categoryName, wrongPhrase) {
        const { state } = this._setupDialogHandler(false);
        await this._openDeleteCategoryConfirmForm(wrongPhrase);
        await this.page.locator(locators.deleteCategoryConfirmButton).click();
        expect(state.dialogAppeared).toBeFalsy();
        await this.check.currentTiddlerIs('Category');
        await this.page.locator(locators.cancelDeleteCategoryButton).click();
        await this.check.deleteCategoryConfirmFormIsClosed();
        expect(await this.check.categoryExists(categoryName)).toBeTruthy()
    }

    async cancelDeleteCategoryAfterConfirmation(categoryName) {
        await this._openDeleteCategoryConfirmForm(constants.deleteConfirmationPhrase);
        await this.page.locator(locators.cancelDeleteCategoryButton).click();
        await this.check.deleteCategoryConfirmFormIsClosed();
        await this.check.currentTiddlerIs('Category');
        expect(await this.check.categoryExists(categoryName)).toBeTruthy()
    }

    async assignCategoryToDomain(categoryName, categoryDescription, targetDomainName) {
        await this.openCategoryEditor(categoryName, categoryDescription);
        const linkDomainButton = this.page.locator(locators.linkDomainButton);
        await expect(linkDomainButton).toBeVisible();
        await linkDomainButton.click();
        const dropdown = this.page.locator(locators.linkDomainDropdown);
        await expect(dropdown).toBeVisible();
        const domainItem = this.page.locator(locators.linkDomainItem.replace('${domainName}', targetDomainName));
        await expect(domainItem).toBeVisible();
        await domainItem.click();
        await expect(dropdown).not.toBeVisible();
        await this.check.categoryIsLinkedToDomain(targetDomainName);
        await this.page.locator(locators.saveCategoryButton).click();
        await this.check.categoryEditorIsClosed(categoryName, categoryDescription);
    }

    async detachCategoryFromDomain(categoryName, categoryDescription, targetDomainName) {
        await this.openCategoryEditor(categoryName, categoryDescription);
        await this.check.categoryIsLinkedToDomain(targetDomainName);
        const dialogPromise = new Promise((resolve) => {
            this.page.once('dialog', async (dialog) => {
                expect(dialog.type()).toBe('confirm');
                expect(dialog.message()).toBe(locators.detachCategoryModalText);
                await dialog.accept();
                resolve();
            });
        });
        const removeDomainButton = this.page.locator(locators.removeDomainButton.replace('${domainName}', targetDomainName));
        await expect(removeDomainButton).toBeVisible();
        await removeDomainButton.click();
        await dialogPromise;
        await this.check.categoryIsNotLinkedToDomain(targetDomainName);
        await this.page.locator(locators.saveCategoryButton).click();
        await this.check.categoryEditorIsClosed(categoryName, categoryDescription);
    }

    async navigateToDomainFromCategoryTag(targetDomainName, targetDomainDescription) {
        const clickableDomainTag = this.page.locator(locators.clickableDomainTag.replace('${domainName}', targetDomainName));
        await expect(clickableDomainTag).toBeVisible();
        await clickableDomainTag.click();
        await this.check.currentTiddlerIs('Domain');
        await this.check.domainFormInViewMode(targetDomainName, targetDomainDescription);
    }

    async openAddThesisEditor() {
        await this.page.locator(locators.addThesisButton).click();
        await this.check.addThesisEditorIsOpened();
    }

    async createThesis(thesisText, thesisNote, correctStatements, incorrectStatements) {
        await this.page.locator(locators.thesisTextInput).fill(thesisText);
        if (thesisNote) {
            await this.page.locator(locators.thesisNoteInput).fill(thesisNote);
        }
        if (correctStatements || incorrectStatements) {
            await this.page.locator(locators.thesisContainsStatementsRadio).click();
            const css = this.page.locator(locators.thesisCorrectStatementInputSection)
            await expect(css).toBeVisible();
            const iss = this.page.locator(locators.thesisIncorrectStatementInputSection)
            await expect(iss).toBeVisible();
            if (correctStatements) {
                const si = this.page.locator(locators.thesisCorrectStatementInput)
                await si.first().waitFor({ state: 'visible' })
                for (let i = 0; i < correctStatements.length; i++) {
                    if (i > 0) await this.page.locator(locators.thesisAddAnotherCorrectButton).click()
                    await si.nth(i).waitFor({ state: 'visible' })
                    await si.nth(i).fill(correctStatements[i])
                }
            }
            if (incorrectStatements) {
                const si = this.page.locator(locators.thesisIncorrectStatementInput)
                await si.first().waitFor({ state: 'visible' })
                for (let i = 0; i < incorrectStatements.length; i++) {
                    if (i > 0) await this.page.locator(locators.thesisAddAnotherIncorrectButton).click()
                    await si.nth(i).waitFor({ state: 'visible' })
                    await si.nth(i).fill(incorrectStatements[i])
                }
            }
        }
        await this.page.locator(locators.createThesisButton).click();
        await this.check.addThesisEditorIsClosed();
    }

    async cancelCreateThesis(thesisText, thesisNote) {
        await this.page.locator(locators.thesisTextInput).fill(thesisText);
        if (thesisNote) {
            await this.page.locator(locators.thesisNoteInput).fill(thesisNote);
        }
        await this.page.locator(locators.cancelCreateThesisButton).click();
        await this.check.addThesisEditorIsClosed();
    }

    async getThesisRef(thesisText) {
        // Find thesis text element
        const thesisTextElement = this.page.locator(locators.thesisText.replace('${text}', thesisText));
        await expect(thesisTextElement).toBeVisible();
        // Find the thesis container with data-thesis-ref attribute
        const thesisContainer = thesisTextElement.locator('xpath=ancestor::div[@class="zest-thesis-container"]').first();
        await expect(thesisContainer).toBeVisible();
        const thesisRef = await thesisContainer.getAttribute('data-thesis-ref');
        return thesisRef;
    }

    async openEditThesisEditor(thesisText) {
        const thesisRef = await this.getThesisRef(thesisText);
        // Find the thesis container
        const thesisContainer = this.page.locator(locators.thesisContainer.replace('${thesisRef}', thesisRef));
        // Find and click edit button within this specific thesis container
        const editButton = thesisContainer.locator(locators.editThesisButton);
        await expect(editButton).toBeVisible();
        await editButton.click();
        // Verify edit form opened
        await this.check.editThesisEditorIsOpened(thesisRef);
        return thesisRef;
    }

    async editThesis(thesisRef, newThesisText, newThesisNote, correctStatements, incorrectStatements) {
        const form = this.page.locator(locators.thesisEditForm.replace('${thesisRef}', thesisRef));
        await form.locator(locators.editThesisTextInput).fill(newThesisText);
        if (newThesisNote) {
            await form.locator(locators.editThesisNoteInput).fill(newThesisNote);
        }
        if (correctStatements || incorrectStatements) {
            await form.locator(locators.thesisContainsStatementsRadio).click();
            const css = form.locator(locators.thesisCorrectStatementInputSection)
            await expect(css).toBeVisible();
            const iss = form.locator(locators.thesisIncorrectStatementInputSection)
            await expect(iss).toBeVisible();
            if (correctStatements) {
                const si = form.locator(locators.thesisCorrectStatementInput)
                await si.first().waitFor({ state: 'visible' })
                for (let i = 0; i < correctStatements.length; i++) {
                    if (i > 0) await form.locator(locators.thesisAddAnotherCorrectButton).click()
                    await si.nth(i).waitFor({ state: 'visible' })
                    await si.nth(i).fill(correctStatements[i])
                }
            }
            if (incorrectStatements) {
                const si = form.locator(locators.thesisIncorrectStatementInput)
                await si.first().waitFor({ state: 'visible' })
                for (let i = 0; i < incorrectStatements.length; i++) {
                    if (i > 0) await form.locator(locators.thesisAddAnotherIncorrectButton).click()
                    await si.nth(i).waitFor({ state: 'visible' })
                    await si.nth(i).fill(incorrectStatements[i])
                }
            }
        }
        await form.locator(locators.saveThesisButton).click();
        await this.check.editThesisEditorIsClosed(thesisRef);
        // Wait for new thesis text to appear
        await expect(this.page.locator(locators.thesisText.replace('${text}', newThesisText))).toBeVisible();
    }

    async cancelEditThesis(thesisRef, originalText) {
        const form = this.page.locator(locators.thesisEditForm.replace('${thesisRef}', thesisRef));
        await form.locator(locators.editThesisTextInput).fill('Modified Thesis Text (cancelled)');
        await form.locator(locators.editThesisNoteInput).fill('Modified Thesis Note (cancelled)');
        await form.locator(locators.cancelEditThesisButton).click();
        await this.check.editThesisEditorIsClosed(thesisRef);
        // Verify original text is still visible
        await expect(this.page.locator(locators.thesisText.replace('${text}', originalText))).toBeVisible();
    }

    async editThesisStatements(thesisRef, correctStatements, incorrectStatements) {
        const form = this.page.locator(locators.thesisEditForm.replace('${thesisRef}', thesisRef));
        // Ensure statements section is visible
        const css = form.locator(locators.thesisCorrectStatementInputSection);
        const isStatementsVisible = await css.isVisible();

        if (!isStatementsVisible) {
            await form.locator(locators.thesisContainsStatementsRadio).click();
            await expect(css).toBeVisible();
        }

        const iss = form.locator(locators.thesisIncorrectStatementInputSection);
        await expect(iss).toBeVisible();

        if (correctStatements) {
            const si = form.locator(locators.thesisCorrectStatementInput);
            const currentCount = await si.count();

            for (let i = 0; i < correctStatements.length; i++) {
                if (i >= currentCount) {
                    // Add new statement
                    await form.locator(locators.thesisAddAnotherCorrectButton).click();
                    await si.nth(i).waitFor({ state: 'visible' });
                }
                // Fill or modify statement
                await si.nth(i).fill(correctStatements[i]);
            }
        }

        if (incorrectStatements) {
            const si = form.locator(locators.thesisIncorrectStatementInput);
            const currentCount = await si.count();

            for (let i = 0; i < incorrectStatements.length; i++) {
                if (i >= currentCount) {
                    // Add new statement
                    await form.locator(locators.thesisAddAnotherIncorrectButton).click();
                    await si.nth(i).waitFor({ state: 'visible' });
                }
                // Fill or modify statement
                await si.nth(i).fill(incorrectStatements[i]);
            }
        }

        await form.locator(locators.saveThesisButton).click();
        await this.check.editThesisEditorIsClosed(thesisRef);
    }

    async deleteThesisStatements(thesisRef, correctStatementsToDelete, incorrectStatementsToDelete) {
        const form = this.page.locator(locators.thesisEditForm.replace('${thesisRef}', thesisRef));

        if (correctStatementsToDelete && correctStatementsToDelete.length > 0) {
            const statementInputs = form.locator(locators.thesisCorrectStatementInput);
            const deleteButtons = form.locator(locators.thesisDeleteCorrectStatementButton);

            for (const statementToDelete of correctStatementsToDelete) {
                const count = await statementInputs.count();
                for (let i = 0; i < count; i++) {
                    const value = await statementInputs.nth(i).inputValue();
                    if (value === statementToDelete) {
                        await deleteButtons.nth(i).click();
                        break;
                    }
                }
            }
        }

        if (incorrectStatementsToDelete && incorrectStatementsToDelete.length > 0) {
            const statementInputs = form.locator(locators.thesisIncorrectStatementInput);
            const deleteButtons = form.locator(locators.thesisDeleteIncorrectStatementButton);

            for (const statementToDelete of incorrectStatementsToDelete) {
                const count = await statementInputs.count();
                for (let i = 0; i < count; i++) {
                    const value = await statementInputs.nth(i).inputValue();
                    if (value === statementToDelete) {
                        await deleteButtons.nth(i).click();
                        break;
                    }
                }
            }
        }

        await form.locator(locators.saveThesisButton).click();
        await this.check.editThesisEditorIsClosed(thesisRef);
    }

    async removeAllThesisStatements(thesisRef) {
        const form = this.page.locator(locators.thesisEditForm.replace('${thesisRef}', thesisRef));

        // Check if statements section is currently visible
        const css = form.locator(locators.thesisCorrectStatementInputSection);
        const hasStatements = await css.isVisible();

        if (hasStatements) {
            // Set up dialog handler for confirmation only if there are statements to delete
            const dialogPromise = new Promise((resolve) => {
                this.page.once('dialog', async (dialog) => {
                    expect(dialog.type()).toBe('confirm');
                    expect(dialog.message()).toBe('Do you wish to delete all statements for this thesis? That cannot be undone!');
                    await dialog.accept();
                    resolve();
                });
            });

            // Click "Thesis does not contain statements" radio button
            await form.locator(locators.thesisDoesNotContainStatementsRadio).click();

            // Wait for confirmation dialog
            await dialogPromise;

            // Verify statements sections are not visible
            await expect(css).not.toBeVisible();
        }

        await form.locator(locators.saveThesisButton).click();
        await this.check.editThesisEditorIsClosed(thesisRef);
    }

    async attachThesisToCategory(thesisRef, categoryName) {
        const form = this.page.locator(locators.thesisEditForm.replace('${thesisRef}', thesisRef));
        const linkCategoryButton = form.locator(locators.linkCategoryButton);
        await expect(linkCategoryButton).toBeVisible();
        await linkCategoryButton.click();
        const dropdown = form.locator(locators.linkCategoryDropdown);
        await expect(dropdown).toBeVisible();
        const categoryItem = form.locator(locators.linkCategoryItem.replace('${categoryName}', categoryName));
        await expect(categoryItem).toBeVisible();
        await categoryItem.click();
        await expect(dropdown).not.toBeVisible();
        await this.check.thesisIsLinkedToCategory(thesisRef, categoryName);
        await form.locator(locators.saveThesisButton).click();
        await this.check.editThesisEditorIsClosed(thesisRef);
    }

    async detachThesisFromCategory(thesisRef, categoryName) {
        const form = this.page.locator(locators.thesisEditForm.replace('${thesisRef}', thesisRef));
        await this.check.thesisIsLinkedToCategory(thesisRef, categoryName);
        const dialogPromise = new Promise((resolve) => {
            this.page.once('dialog', async (dialog) => {
                expect(dialog.type()).toBe('confirm');
                expect(dialog.message()).toBe(locators.detachThesisModalText);
                await dialog.accept();
                resolve();
            });
        });
        const removeCategoryButton = form.locator(locators.removeCategoryButton.replace('${categoryName}', categoryName));
        await expect(removeCategoryButton).toBeVisible();
        await removeCategoryButton.click();
        await dialogPromise;
        await this.check.thesisIsNotLinkedToCategory(thesisRef, categoryName);
        const saveButton = form.locator(locators.saveThesisButton);
        await expect(saveButton).toBeVisible();
        await saveButton.click();
        await this.check.editThesisEditorIsClosed(thesisRef);
    }

    async showThesisNote(thesisRef) {
        const container = this.page.locator(locators.thesisContainer.replace('${thesisRef}', thesisRef));
        const showButton = container.locator(locators.showThesisNoteButton);
        await expect(showButton).toBeVisible();
        await showButton.click();
        await this.check.thesisNoteIsVisible(thesisRef);
    }

    async hideThesisNote(thesisRef) {
        const container = this.page.locator(locators.thesisContainer.replace('${thesisRef}', thesisRef));
        const hideButton = container.locator(locators.hideThesisNoteButton);
        await expect(hideButton).toBeVisible();
        await hideButton.click();
        await this.check.thesisNoteIsNotVisible(thesisRef);
    }

    async deleteThesis(thesisText) {
        const thesisRef = await this.getThesisRef(thesisText);
        const container = this.page.locator(locators.thesisContainer.replace('${thesisRef}', thesisRef));

        // Click the outside Delete button
        const outsideDeleteButton = container.locator(locators.deleteThesisOutsideButton);
        await expect(outsideDeleteButton).toBeVisible();
        await outsideDeleteButton.click();

        // Fill the confirmation input with DELETE
        const confirmInput = container.locator(locators.deleteThesisConfirmInput);
        await expect(confirmInput).toBeVisible();
        await confirmInput.fill(constants.deleteConfirmationPhrase);

        // Set up dialog handler for final confirmation
        const dialogPromise = new Promise((resolve) => {
            this.page.once('dialog', async (dialog) => {
                expect(dialog.type()).toBe('confirm');
                expect(dialog.message()).toBe(locators.deleteThesisModalText);
                await dialog.accept();
                resolve();
            });
        });

        // Click the inside Delete Thesis button
        const confirmButton = container.locator(locators.deleteThesisConfirmButton);
        await expect(confirmButton).toBeVisible();
        await confirmButton.click();

        await dialogPromise;

        // Wait for thesis container to be removed from DOM
        await expect(container).not.toBeVisible();
    }

}

module.exports = { ZestPage };