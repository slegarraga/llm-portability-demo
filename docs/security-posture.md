# Security posture

`llm-portability-demo` is an offline demo repo for the provider-portability
suite. It still tracks supply-chain controls because it is the public landing
point for the packages.

Current controls:

- MIT license and public security policy.
- GitHub vulnerability alerts and Dependabot security updates.
- Secret scanning and push protection.
- CI that runs the offline demo.
- CodeQL analysis for JavaScript.
- OpenSSF Scorecard workflow with published results.
- Pinned GitHub Actions and least-privilege workflow permissions.
- Branch ruleset for `main` requiring CI and CodeQL checks before merge.
- Tracked npm lockfile for reproducible demo installs.
- CODEOWNERS for maintainer review visibility.

Security reports should not be opened as public issues. Use the process in
[SECURITY.md](../SECURITY.md) or contact
[sebastian@0a.cl](mailto:sebastian@0a.cl).
