# GitFlow for ABSONS Meet Electron

## Branch Roles

- `master`: Production/release branch.
- `develop`: Active development integration branch.
- `feature/*`: Feature work branches created from `develop`.
- `release/*`: Release preparation branches created from `develop`.
- `hotfix/*`: Urgent production fixes created from `master`.

Only pushes to `master` trigger the release workflow (`.github/workflows/release-master.yml`).

## Create `develop` branch (if missing)

```bash
git checkout master
git pull origin master
git checkout -b develop
git push -u origin develop
```

## Feature branch workflow

```bash
git checkout develop
git pull origin develop
git checkout -b feature/<feature-name>

# make changes
npm version patch --no-git-tag-version

# commit and push
git add .
git commit -m "feat: <short description>"
git push -u origin feature/<feature-name>
```

Then open a PR from `feature/<feature-name>` to `develop`.

## Release preparation (`develop` -> `master`)

```bash
git checkout develop
git pull origin develop
git checkout -b release/<version>

# optional final version bump
npm version patch --no-git-tag-version

git add .
git commit -m "chore: prepare release <version>"
git push -u origin release/<version>
```

Then:

1. Open PR `release/<version>` -> `master`.
2. Merge the PR.
3. Push/merge to `master` triggers build and release automation.

## Hotfix workflow

```bash
git checkout master
git pull origin master
git checkout -b hotfix/<issue-name>

# fix, test, commit, push
git add .
git commit -m "fix: <short description>"
git push -u origin hotfix/<issue-name>
```

Then open PR to `master`, merge, and back-merge the same fix into `develop`.
