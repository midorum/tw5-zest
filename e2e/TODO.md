# E2E Test Coverage TODO

## Completed Test Cases ✅

### Domain Tests (9 tests)
- ✅ R-D-001: Create domain "Regression 1 Domain"
- ✅ R-D-002: Create domain "Regression 2 Domain"
- ✅ R-D-003: Create domain "Regression 3 Domain"
- ✅ R-D-004: Cancel domain creation
- ✅ R-D-005: Navigate to domain
- ✅ R-D-006: Edit domain
- ✅ R-D-007: Delete domain
- ✅ R-D-008: Try to delete domain with linked categories (should fail)
- ✅ R-D-009: Cancel editing domain

### Category Tests (17 tests)
- ✅ R-C-001: Create category "Regression 1 Category"
- ✅ R-C-002: Create category "Regression 2 Category"
- ✅ R-C-003: Create category "Regression 3 Category"
- ✅ R-C-004: Navigate to category
- ✅ R-C-005: Edit category
- ✅ R-C-006: Fail to delete category with wrong confirmation phrase
- ✅ R-C-007: Cancel deleting category
- ✅ R-C-008: Delete category
- ✅ R-C-009: Cancel editing category
- ✅ R-C-010: Assign category to domain
- ✅ R-C-010: Navigate from category to domain through tag
- ✅ R-C-011: Detach category from domain
- ✅ R-C-012: Create category with shared thesis for deletion test
- ✅ R-C-013: Attach shared thesis to another category
- ✅ R-C-014: Verify shared thesis is visible in both categories
- ✅ R-C-015: Delete category with multi-linked thesis (thesis should remain)
- ✅ R-C-016: Create category with single thesis
- ✅ R-C-017: Delete category with single-linked thesis (both should be deleted)

### Thesis Tests (16 tests)
- ✅ R-T-001: Create thesis without statements
- ✅ R-T-002: Create thesis with statements
- ✅ R-T-003: Cancel creating thesis
- ✅ R-T-004: Cancel editing thesis
- ✅ R-T-005: Edit thesis and add statements
- ✅ R-T-006: Edit statements of thesis
- ✅ R-T-007: Create thesis with statements for deletion test
- ✅ R-T-008: Delete statements from thesis
- ✅ R-T-009: Create thesis with statements for complete deletion test
- ✅ R-T-010: Remove all statements from thesis
- ✅ R-T-011: Attach thesis to another category
- ✅ R-T-012: Verify thesis is visible in second category
- ✅ R-T-013: Detach thesis from second category
- ✅ R-T-014: Verify thesis is not visible after detachment
- ✅ R-T-015: Create thesis for deletion test
- ✅ R-T-016: Delete thesis

### Navigation Tests (2 tests)
- ✅ R-N-001: Open initial tiddler
- ✅ R-N-002: Navigate to Zest Home

**Total Implemented: 44 tests**

---

## Desirable Test Cases (Not Implemented)

### Domain Validation Tests
1. **Empty domain name validation**
   - Try to create domain with empty name field
   - Expected: validation error or disabled create button

2. **Very long domain name**
   - Create domain with name > 200 characters
   - Expected: truncation or validation error

3. **Duplicate domain name**
   - Create domain with same name as existing domain
   - Expected: error or automatic renaming

### Category Validation Tests
4. **Empty category name validation**
   - Try to create category without name
   - Expected: validation error or disabled create button

5. **Very long category name**
   - Create category with name > 200 characters
   - Expected: truncation or validation error

6. **Duplicate category name in same domain**
   - Create category with same name in one domain
   - Expected: error or allow (categories might be distinguished by domain)

7. **Edit category without changes**
   - Open edit, don't change anything, save
   - Expected: no errors, category unchanged

### Thesis Validation Tests
8. **Empty thesis text validation**
   - Try to create thesis without text
   - Expected: validation error or disabled create button

9. **Very long thesis text**
   - Create thesis with text > 1000 characters
   - Expected: truncation or validation error

10. **Empty statement validation**
    - Try to add empty correct/incorrect statement
    - Expected: validation error or disabled add button

11. **Duplicate thesis text**
    - Create thesis with identical text to existing thesis
    - Expected: allow (theses are separate entities) or warning

12. **Maximum statements limit**
    - Add > 10 statements to thesis
    - Expected: limit enforcement or allow unlimited

13. **Edit thesis without changes**
    - Open edit, don't change anything, save
    - Expected: no errors, thesis unchanged

### Navigation & UI Tests
14. **Browser back/forward navigation**
    - Navigate through domains/categories, use browser back/forward
    - Expected: correct navigation history

15. **Multiple open tiddlers**
    - Open several categories/theses simultaneously
    - Expected: all work independently

16. **Search functionality** (if exists)
    - Search for domains/categories/theses
    - Expected: correct search results

17. **Sorting and filtering** (if exists)
    - Test various sort/filter options
    - Expected: correct ordering/filtering

### Edge Cases & Special Characters
18. **Special characters in names**
    - Use emoji, quotes, brackets in names
    - Expected: proper handling/escaping

19. **Unicode support**
    - Use Cyrillic, Chinese, Arabic characters
    - Expected: proper display and storage

20. **Concurrent editing**
    - Open same entity for editing twice
    - Expected: proper conflict resolution or prevention

21. **Rapid button clicking**
    - Click create/delete buttons multiple times rapidly
    - Expected: no duplicate operations or race conditions

22. **Delete confirmation phrase variations**
    - Try "delete", "Delete ", " DELETE", etc.
    - Expected: only exact "DELETE" works

---

## Summary

**Implemented:** 44 critical and important functional tests
**Remaining:** ~22 desirable validation and edge case tests

The current test coverage is sufficient for basic regression testing. The remaining tests would add additional robustness but are not essential for core functionality validation.
