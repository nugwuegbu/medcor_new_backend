# GitHub Push Instructions

## Step 1: Create the Repository on GitHub

First, go to GitHub and create the repository:
1. Go to https://github.com/new
2. Repository name: `medcor_new_backend`
3. Set as Public or Private
4. Click "Create repository"

## Step 2: Get Your GitHub Token

You need your actual GitHub personal access token (not the text "GITHUB_TOKEN").

If you don't have one:
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Give it a name like "medcor-deployment"
4. Select scopes: `repo` (full control)
5. Generate and copy the token

## Step 3: Push Your Code

Replace `YOUR_ACTUAL_TOKEN_HERE` with your real token:

```bash
# Add and commit
git add .
git commit -m "added deployment manual"

# Push with your actual token (not the word GITHUB_TOKEN)
git push https://YOUR_ACTUAL_TOKEN_HERE@github.com/nugwuegbu/medcor_new_backend.git main
```

Example (with a fake token for illustration):
```bash
git push https://ghp_abcd1234efgh5678ijkl@github.com/nugwuegbu/medcor_new_backend.git main
```

## Alternative: Use SSH Instead

If you have SSH keys set up:
```bash
git remote set-url origin git@github.com:nugwuegbu/medcor_new_backend.git
git push origin main
```

## Troubleshooting

If you get "repository not found":
- Verify the repository exists at https://github.com/nugwuegbu/medcor_new_backend
- Check if your token has `repo` permissions
- Ensure you're using your actual token, not the text "GITHUB_TOKEN"