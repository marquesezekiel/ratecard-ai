# Accessibility Guide

RateCard.AI is committed to WCAG 2.2 Level AA compliance.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| ? | Show keyboard shortcuts help |
| g h | Go to Home/Dashboard |
| g i | Go to Inbox/Analyze |
| g r | Go to Rates |
| n | Create new rate card |
| Esc | Close modal/dialog |

## Screen Reader Support

- All pages have proper heading hierarchy (h1 → h2 → h3)
- Skip links available to bypass navigation
- Form fields have proper labels and error announcements
- Dynamic content announced via aria-live regions
- Interactive elements have descriptive accessible names

## Motion Preferences

Animations are disabled when `prefers-reduced-motion: reduce` is set in system preferences.

## Color Contrast

All text meets WCAG AA contrast requirements:
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum

## Testing

### Automated Testing
- axe-core runs in development mode
- eslint-plugin-jsx-a11y catches issues during development
- Lighthouse accessibility audits in CI

### Manual Testing Checklist
- [ ] Tab through entire page - logical order?
- [ ] All interactive elements reachable by keyboard?
- [ ] Focus visible at all times?
- [ ] Can close modals with Escape?
- [ ] Screen reader announces page content correctly?
- [ ] Content readable at 200% zoom?
- [ ] Works in high contrast mode?

## Known Limitations

1. None currently documented

## Reporting Issues

If you encounter accessibility barriers, please report them to the GitHub issue tracker.
