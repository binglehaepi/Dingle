# Dingle Icon

## Current Icon

This is a **temporary placeholder icon** with the letter "D" on a blue background.

## To Replace with Custom Icon:

### Requirements:
- **Windows**: `icon.ico` (256x256 or larger)
- **macOS**: `icon.icns` (512x512 or larger)
- **Linux**: `icon.png` (512x512 PNG)

### Tools to Convert:
1. **Online**: https://cloudconvert.com/png-to-ico
2. **macOS**: Use `iconutil` or https://cloudconvert.com/png-to-icns
3. **Multi-platform**: Use `electron-icon-builder` npm package

### Steps:
1. Create a 1024x1024 PNG source image
2. Convert to required formats:
   - `icon.ico` for Windows
   - `icon.icns` for macOS
   - `icon.png` for Linux (512x512)
3. Place files in `build/` directory
4. Rebuild the app

### Placeholder Icon Info:
- Color: #4A90E2 (blue)
- Letter: "D" (for Dingle)
- Size: 512x512
- Format: SVG (will need conversion for production builds)

**Note**: For production, you should replace this with a proper branded icon!

