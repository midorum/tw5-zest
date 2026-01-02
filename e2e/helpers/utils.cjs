const model = {
    domain1: { // for categories
        name: 'Regression 1 Domain',
        description: 'Regression 1 Domain Description'
    },
    domain2: { // for assigning
        name: 'Regression 2 Domain',
        description: 'Regression 2 Domain Description'
    },
    domain3: { // for editing
        name: 'Regression 3 Domain',
        description: 'Regression 3 Domain Description'
    },
    domain3Edited: { // for deleting
        name: 'Regression 3 Domain Edited',
        description: 'Regression 3 Domain Description Edited'
    },
    category1: {
        name: 'Regression 1 Category',
        description: 'Regression 1 Category Description',
        thesisText: 'Regression 1 Thesis',
        thesisNote: 'Regression 1 Thesis Note',
        thesisTextEdited: 'Regression 1 Thesis Edited',
        thesisNoteEdited: 'Regression 1 Thesis Note Edited',
        thesisCorrectStatements: ['Regression 1 Thesis Correct A', 'Regression 1 Thesis Correct B'],
        thesisIncorrectStatements: ['Regression 1 Thesis Incorrect C', 'Regression 1 Thesis Incorrect D', 'Regression 1 Thesis Incorrect E']
    },
    category2: {
        name: 'Regression 2 Category',
        description: 'Regression 2 Category Description'
    },
    category3: {
        name: 'Regression 3 Category',
        description: 'Regression 3 Category Description',
        thesisText: 'Regression 3 Thesis',
        thesisNote: 'Regression 3 Thesis Note',
        correctStatements: ['Regression 3 Correct A', 'Regression 3 Correct B'],
        incorrectStatements: ['Regression 3 Incorrect C', 'Regression 3 Incorrect D', 'Regression 3 Incorrect E']
    },
    category3Edited: {
        name: 'Regression 3 Category Edited',
        description: 'Regression 3 Category Description Edited'
    },
    category4: {
        name: 'Regression 4 Category (for deletion with shared thesis)',
        description: 'Regression 4 Category Description'
    },
    category5: {
        name: 'Regression 5 Category (for deletion with single thesis)',
        description: 'Regression 5 Category Description'
    },
    thesis1: {
        text: 'Regression 1 New Thesis',
        note: 'Regression 1 New Thesis Note'
    },
    thesis2: {
        text: 'Regression 2 New Thesis',
        note: 'Regression 2 New Thesis Note',
        correctStatements: ['Thesis 2 Correct A', 'Thesis 2 Correct B'],
        incorrectStatements: ['Thesis 2 Incorrect C', 'Thesis 2 Incorrect D', 'Thesis 2 Incorrect E'],
        // For editing test: modify first correct and first incorrect, add new ones
        correctStatementsEdited: ['Thesis 2 Correct A Modified', 'Thesis 2 Correct B', 'Thesis 2 Correct F'],
        incorrectStatementsEdited: ['Thesis 2 Incorrect C Modified', 'Thesis 2 Incorrect D', 'Thesis 2 Incorrect E', 'Thesis 2 Incorrect G']
    },
    thesis3: {
        text: 'Regression 3 New Thesis (cancelled)',
        note: 'Regression 3 New Thesis Note (cancelled)'
    },
    thesis4: {
        text: 'Regression 4 New Thesis',
        note: 'Regression 4 New Thesis Note',
        correctStatements: ['Thesis 4 Correct A', 'Thesis 4 Correct B', 'Thesis 4 Correct C'],
        incorrectStatements: ['Thesis 4 Incorrect D', 'Thesis 4 Incorrect E', 'Thesis 4 Incorrect F', 'Thesis 4 Incorrect G'],
        // For deletion test: remove one correct (B) and one incorrect (E)
        correctStatementsAfterDeletion: ['Thesis 4 Correct A', 'Thesis 4 Correct C'],
        incorrectStatementsAfterDeletion: ['Thesis 4 Incorrect D', 'Thesis 4 Incorrect F', 'Thesis 4 Incorrect G']
    },
    thesis5: {
        text: 'Regression 5 New Thesis',
        note: 'Regression 5 New Thesis Note',
        correctStatements: ['Thesis 5 Correct A', 'Thesis 5 Correct B'],
        incorrectStatements: ['Thesis 5 Incorrect C', 'Thesis 5 Incorrect D']
    },
    thesis6: {
        text: 'Regression 6 New Thesis (for deletion)',
        note: 'Regression 6 New Thesis Note (will be deleted)'
    },
    thesis7: {
        text: 'Regression 7 Shared Thesis (multi-category)',
        note: 'Regression 7 Shared Thesis Note (will be shared between categories)'
    },
    thesis8: {
        text: 'Regression 8 Single Thesis (will be deleted with category)',
        note: 'Regression 8 Single Thesis Note'
    },
}

const constants = {
    deleteConfirmationPhrase: 'DELETE'
}

const locators = {
    invisibleButton: 'button.tc-btn-invisible.tc-tiddlylink',
    storyRiver: '.tc-story-river',
    currentDomainAttr: '.tc-tiddler-frame[data-tiddler-title="${title}"]',
    currentDomainTitle: '.tc-title:text-is("${title}")',
    addDomainButton: 'button.tc-btn-invisible.tc-tiddlylink:text-is("[Add Domain]")',
    addDomainNameInput: '.zest-add-domain-form .zest-domain-name label:text-is("Domain name:") input[type="text"]',
    addDomainDescriptionInput: '.zest-add-domain-form .zest-domain-description label:text-is("Description:") textarea',
    createDomainButton: 'button.tc-btn-invisible.tc-tiddlylink:text-is("[Create Domain]")',
    cancelCreateDomainButton: 'button.tc-btn-invisible.tc-tiddlylink:text-is("[Cancel]")',
    navigateToDomainButton: '.zest-domains-list button.tc-btn-invisible:text-is("${domainName}")',
    startLearningDomainButton: '.zest-domains-list button.tc-btn-invisible:text-is("${domainName}") ~ button[title="Learn categories in this domain"]',
    domainNameView: '.zest-domain-name p:text-is("${text}")',
    domainDescriptionView: '.zest-domain-description p:text-is("${text}")',
    editDomainButton: 'button.tc-btn-invisible.tc-tiddlylink.zest-edit-domain-button:text-is("[Edit]")',
    addCategoryButton: 'button.tc-btn-invisible.tc-tiddlylink:text-is("[Add Category]")',
    deleteDomainButton: 'button.tc-btn-invisible.tc-tiddlylink:text-is("[Delete Domain]")',
    domainNameInput: '.zest-domain-name label:text-is("Domain Name:") input[type="text"]',
    domainDescriptionInput: '.zest-domain-description label:text-is("Domain Description:") textarea',
    saveDomainButton: 'button.tc-btn-invisible.tc-tiddlylink:text-is("[Save]")',
    cancelEditDomainButton: 'button.tc-btn-invisible.tc-tiddlylink:text-is("[Cancel]")',
    deleteDomainModalText: 'Do you wish to delete this domain? This cannot be undone!',
    addCategoryNameInput: '.zest-wide-input label:has-text("Category name:") input[type="text"]',
    addCategoryDescriptionInput: '.zest-wide-input label:has-text("Category Description:") textarea',
    addCategoryThesisTextInput: '.zest-wide-input label:has-text("Thesis text:") textarea',
    addCategoryThesisNoteInput: '.zest-wide-input label:has-text("Thesis note:") textarea',
    createCategoryButton: 'button.tc-btn-invisible.tc-tiddlylink:text-is("[Create Category]")',
    cancelCreateCategoryButton: 'button.tc-btn-invisible.tc-tiddlylink:text-is("[Cancel]")',
    domainCategoryButton: 'button.tc-btn-invisible.tc-tiddlylink:text-is("${categoryName}")',
    thesisContainsStatementsRadio: 'label.tc-radio span:text-is("Thesis contains statements")',
    thesisDoesNotContainStatementsRadio: 'label.tc-radio span:text-is("Thesis does not contain statements")',
    thesisCorrectStatementInputSection: '.zest-correct-statement-input-section',
    thesisIncorrectStatementInputSection: '.zest-incorrect-statement-input-section',
    thesisAddAnotherCorrectButton: 'button.tc-btn-invisible.tc-tiddlylink:text-is("[Add another correct statement]")',
    thesisAddAnotherIncorrectButton: 'button.tc-btn-invisible.tc-tiddlylink:text-is("[Add another incorrect statement]")',
    thesisCorrectStatementInput: '.zest-correct-statement-input textarea',
    thesisIncorrectStatementInput: '.zest-incorrect-statement-input textarea',
    thesisDeleteCorrectStatementButton: '.zest-correct-statement-input button.tc-btn-invisible.tc-tiddlylink:text-is("[Delete]")',
    thesisDeleteIncorrectStatementButton: '.zest-incorrect-statement-input button.tc-btn-invisible.tc-tiddlylink:text-is("[Delete]")',
    thesesHeader: 'h2:text-is("Theses")',
    categoryNameView: 'h2.zest-category-name:has-text("${text}")',
    categoryDescriptionView: 'div.zest-category-description:has-text("${text}")',
    thesisText: 'p.zest-thesis-text:has-text("${text}")',
    showThesisNoteButton: 'button.tc-btn-invisible.tc-tiddlylink:has-text("[Show note]")',
    hideThesisNoteButton: 'button.tc-btn-invisible.tc-tiddlylink:has-text("[Hide note]")',
    thesisNoteText: 'p.zest-thesis-note-text',
    thesisNoteCategories: '.zest-thesis-note-categories',
    thesisNoteCategoryTag: '.zest-thesis-note-categories .tc-tag-label:has-text("${categoryName}")',
    addThesisButton: 'button.tc-btn-invisible.tc-tiddlylink.zest-add-thesis-button:text-is("[Add Thesis]")',
    editThesisButton: 'button.tc-btn-invisible.tc-tiddlylink.zest-edit-thesis-button:text-is("[Edit]")',
    thesisTextInput: '.zest-thesis-text-input textarea',
    thesisNoteInput: '.zest-thesis-note-input textarea',
    createThesisButton: 'button.tc-btn-invisible.tc-tiddlylink.zest-create-thesis-button:text-is("[Create Thesis]")',
    cancelCreateThesisButton: 'button.tc-btn-invisible.tc-tiddlylink.zest-cancel-create-thesis-button:text-is("[Cancel]")',
    editThesisTextInput: '.zest-edit-thesis-text-input textarea',
    editThesisNoteInput: '.zest-edit-thesis-note-input textarea',
    saveThesisButton: 'button.tc-btn-invisible.tc-tiddlylink.zest-save-thesis-button:text-is("[Save]")',
    cancelEditThesisButton: 'button.tc-btn-invisible.tc-tiddlylink.zest-cancel-edit-thesis-button:text-is("[Cancel]")',
    deleteCategoryButton: 'button.tc-btn-invisible.tc-tiddlylink.zest-delete-button-outside:text-is("[Delete Category]")',
    deleteCategoryConfirmInput: '.zest-delete-confirm-form input.zest-delete-confirm-input[type="text"]',
    deleteCategoryConfirmButton: '.zest-delete-confirm-form button.tc-btn-invisible.tc-tiddlylink.zest-delete-button-inside:text-is("[Delete Category]")',
    cancelDeleteCategoryButton: '.zest-delete-confirm-form button.tc-btn-invisible.tc-tiddlylink.zest-cancel-delete-button:text-is("[Cancel]")',
    deleteCategoryModalText: 'Are you absolutely sure? This cannot be undone!',
    editCategoryButton: 'button.tc-btn-invisible.tc-tiddlylink.zest-edit-category-button:text-is("[Edit]")',
    categoryNameInput: '.zest-category-name-input input[type="text"]',
    categoryDescriptionInput: '.zest-category-description-input textarea',
    saveCategoryButton: 'button.tc-btn-invisible.tc-tiddlylink.zest-save-category-button:text-is("[Save]")',
    cancelEditCategoryButton: 'button.tc-btn-invisible.tc-tiddlylink.zest-cancel-edit-category-button:text-is("[Cancel]")',
    linkDomainButton: '.zest-category-domains-section .zest-add-tag-button:text-is("[Link Domain]")',
    linkDomainDropdown: '.zest-category-domains-section .zest-tag-pane-dropdown',
    linkDomainSearchInput: '.zest-category-domains-section .zest-tag-pane-search-input',
    linkDomainItem: '.zest-category-domains-section .zest-tag-pane-item:text-is("${domainName}")',
    linkedDomainTag: '.zest-category-domains-section .tc-tag-label:has-text("${domainName}")',
    removeDomainButton: '.zest-category-domains-section .tc-tag-label:has-text("${domainName}") .zest-remove-tag-button',
    detachCategoryModalText: 'Do you wish to detach the category from this domain?',
    clickableDomainTag: '.zest-category-domains-tags .tc-tag-label .zest-clickable-tag-button:text-is("${domainName}")',
    linkCategoryButton: '.zest-thesis-categories-section .zest-add-tag-button:text-is("[Link Category]")',
    linkCategoryDropdown: '.zest-thesis-categories-section .zest-tag-pane-dropdown',
    linkCategorySearchInput: '.zest-thesis-categories-section .zest-tag-pane-search-input',
    linkCategoryItem: '.zest-thesis-categories-section .zest-tag-pane-item:text-is("${categoryName}")',
    linkedCategoryTag: '.zest-thesis-categories-section .tc-tag-label:has-text("${categoryName}")',
    removeCategoryButton: '.zest-thesis-categories-section .tc-tag-label:has-text("${categoryName}") .zest-remove-tag-button',
    detachThesisModalText: 'Do you wish to detach this thesis from the category?',
    deleteThesisOutsideButton: 'button.tc-btn-invisible.tc-tiddlylink.zest-delete-button-outside:text-is("[Delete]")',
    deleteThesisConfirmInput: '.zest-delete-confirm-form input.zest-delete-confirm-input[type="text"]',
    deleteThesisConfirmButton: '.zest-delete-confirm-form button.tc-btn-invisible.tc-tiddlylink.zest-delete-button-inside:text-is("[Delete Thesis]")',
    cancelDeleteThesisButton: '.zest-delete-confirm-form button.tc-btn-invisible.tc-tiddlylink.zest-cancel-delete-button:text-is("[Cancel]")',
    deleteThesisModalText: 'Are you absolutely sure? This cannot be undone!',
    errorAlertCannotDeleteDomain: '.tc-alert .tc-alert-body:has-text("Cannot delete domain: categories are still linked to this domain")',
    thesisEditForm: '.zest-edit-thesis-form[data-thesis-ref="${thesisRef}"]',
    thesisContainer: '.zest-thesis-container[data-thesis-ref="${thesisRef}"]'
}

module.exports = { constants, locators, model };
