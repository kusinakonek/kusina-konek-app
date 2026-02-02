# Branch Protection Strategy

- **main**: Protected. Requires PR review, passing CI, and linear history.
- **develop**: Protected. Requires PR review and passing CI.
- **feature/***: Feature branches created from `develop` and merged back via PR.

Recommended rules:
- Require pull request reviews before merging
- Require status checks to pass (CI)
- Dismiss stale approvals on new commits
- Restrict force pushes and deletions
