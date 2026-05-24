# Branding Icon Generation

ABSONS Meet icon assets are generated from:

`resources/absons-icon-1024.png`

## One-command generation

```bash
npm run generate-icons
```

This command generates:

- `resources/icon.png`
- `resources/icon.ico`
- `resources/icon.icns`
- `resources/icons/16x16.png`
- `resources/icons/24x24.png`
- `resources/icons/32x32.png`
- `resources/icons/48x48.png`
- `resources/icons/64x64.png`
- `resources/icons/128x128.png`
- `resources/icons/256x256.png`
- `resources/icons/512x512.png`
- `resources/icons/1024x1024.png`

The script prefers macOS `iconutil` for ICNS generation and automatically falls back to `png2icons` when needed.
