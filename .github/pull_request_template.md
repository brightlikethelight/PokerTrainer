# Pull Request

## Description

A clear and concise description of what this PR accomplishes.

### Related Issues

Closes #[issue_number]
Fixes #[issue_number]
Related to #[issue_number]

## Type of Change

Please check all that apply:

- [ ] = Bug fix (non-breaking change that fixes an issue)
- [ ] ( New feature (non-breaking change that adds functionality)
- [ ] =� Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] =� Documentation update (improvements to documentation)
- [ ] =' Maintenance (dependency updates, build improvements, etc.)
- [ ] <� Style/UI change (changes that affect the look and feel)
- [ ] � Performance improvement
- [ ] > � Test improvements
- [ ] = Refactoring (code change that neither fixes a bug nor adds a feature)

## Changes Made

### Core Changes

- [ ] Describe main functionality changes
- [ ] List affected components/modules
- [ ] Note any algorithm or logic improvements

### UI/UX Changes

- [ ] Describe visual changes
- [ ] Note accessibility improvements
- [ ] List responsive design updates

### Testing Changes

- [ ] New tests added
- [ ] Existing tests updated
- [ ] Test coverage improved

## Testing Checklist

### Automated Testing

- [ ] All existing unit tests pass (`npm test`)
- [ ] New unit tests added for new functionality
- [ ] Integration tests pass (`npm run test:integration`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Performance tests within acceptable bounds
- [ ] Code coverage meets minimum thresholds (90%+)

### Manual Testing

- [ ] Tested in Chrome/Chromium
- [ ] Tested in Firefox
- [ ] Tested in Safari (if applicable)
- [ ] Tested on mobile devices
- [ ] Tested with keyboard navigation
- [ ] Tested with screen reader (if UI changes)

### Game Logic Testing (if applicable)

- [ ] Tested poker rules implementation
- [ ] Verified betting logic
- [ ] Tested AI player behavior
- [ ] Verified hand evaluation accuracy
- [ ] Tested edge cases (all-in, side pots, etc.)

## Code Quality Checklist

- [ ] Code follows project style guidelines
- [ ] ESLint passes without errors (`npm run lint`)
- [ ] Prettier formatting applied (`npm run format`)
- [ ] TypeScript checks pass (if applicable)
- [ ] No console.log statements in production code
- [ ] No commented-out code blocks
- [ ] All TODO comments have associated issues
- [ ] Functions are well-documented with JSDoc
- [ ] Complex logic has inline comments

## Performance Impact

### Bundle Size

- [ ] No significant increase in bundle size
- [ ] New dependencies justified and lightweight
- [ ] Tree-shaking opportunities considered

### Runtime Performance

- [ ] No performance regressions detected
- [ ] Memory usage remains stable
- [ ] Renders/re-renders optimized

### Loading Performance

- [ ] Critical path unaffected
- [ ] Lazy loading implemented where appropriate
- [ ] Assets optimized

## Security Considerations

- [ ] No hardcoded secrets or API keys
- [ ] Input validation implemented
- [ ] XSS vulnerabilities addressed
- [ ] No unsafe HTML rendering
- [ ] Dependencies security audit passed

## Accessibility Checklist

- [ ] Keyboard navigation works properly
- [ ] Screen reader friendly
- [ ] Sufficient color contrast
- [ ] Alt text for images
- [ ] ARIA labels where appropriate
- [ ] Focus management implemented

## Documentation Updates

- [ ] README.md updated (if needed)
- [ ] API documentation updated
- [ ] Code comments added/updated
- [ ] CHANGELOG.md updated
- [ ] Migration guide provided (if breaking changes)

## Deployment Notes

### Environment Variables

- [ ] No new environment variables required
- [ ] Environment variables documented

### Database Changes

- [ ] No database changes required
- [ ] Migration scripts provided (if applicable)

### Infrastructure Changes

- [ ] No infrastructure changes required
- [ ] Changes documented in deployment guide

## Breaking Changes

If this PR contains breaking changes, please describe:

1. **What breaks**: Describe what existing functionality will no longer work
2. **Why necessary**: Explain why this breaking change is required
3. **Migration path**: Provide clear steps for users to migrate
4. **Deprecation timeline**: If applicable, provide timeline for deprecated features

## Screenshots/Recordings

### Before

<!-- Add screenshots of the current state -->

### After

<!-- Add screenshots of the new state -->

### Demo

<!-- Add GIFs or video recordings demonstrating new functionality -->

## Additional Notes

### Known Issues

- [ ] List any known issues that will be addressed in future PRs
- [ ] Note any temporary workarounds

### Future Improvements

- [ ] List potential follow-up improvements
- [ ] Note areas for future optimization

### Dependencies

- [ ] No new dependencies added
- [ ] New dependencies: [list with justification]
- [ ] Removed dependencies: [list]

## Reviewer Checklist

For reviewers to complete:

### Code Review

- [ ] Code is readable and well-structured
- [ ] Logic is sound and efficient
- [ ] Error handling is appropriate
- [ ] Tests adequately cover new functionality
- [ ] Documentation is clear and complete

### Functionality Review

- [ ] Feature works as described
- [ ] Edge cases are handled
- [ ] User experience is intuitive
- [ ] Performance is acceptable

### Security Review

- [ ] No security vulnerabilities introduced
- [ ] Input validation is proper
- [ ] Authentication/authorization unchanged or improved

## Definition of Done

This PR is ready to merge when:

- [ ] All automated tests pass
- [ ] Code review is approved
- [ ] Documentation is updated
- [ ] No merge conflicts
- [ ] All checklist items are completed
- [ ] Performance requirements are met
- [ ] Security review passed

---

**Additional Context**

Add any other context about the pull request here. Include links to relevant documentation, design documents, or external resources.

/cc @brightliu
