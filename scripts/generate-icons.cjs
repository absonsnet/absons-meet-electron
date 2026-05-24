#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const sharp = require('sharp');
const pngToIco = require('png-to-ico');
const png2icons = require('png2icons');

const rootDir = path.resolve(__dirname, '..');
const resourcesDir = path.join(rootDir, 'resources');
const sourceIconPath = path.join(resourcesDir, 'absons-icon-1024.png');
const iconPngPath = path.join(resourcesDir, 'icon.png');
const iconIcoPath = path.join(resourcesDir, 'icon.ico');
const iconIcnsPath = path.join(resourcesDir, 'icon.icns');
const linuxIconsDir = path.join(resourcesDir, 'icons');
const uiLogoPath = path.join(rootDir, 'app', 'images', 'logo.png');

const linuxSizes = [ 16, 24, 32, 48, 64, 128, 256, 512, 1024 ];
const iconContentScale = 0.82;
const transparentBackground = {
    r: 0,
    g: 0,
    b: 0,
    alpha: 0
};

async function generateResizedPng(sourcePath, destinationPath, size) {
    const innerSize = Math.round(size * iconContentScale);
    const resizedIcon = await sharp(sourcePath)
        .resize(innerSize, innerSize, {
            fit: 'contain',
            background: transparentBackground
        })
        .png()
        .toBuffer();

    await sharp({
        create: {
            width: size,
            height: size,
            channels: 4,
            background: transparentBackground
        }
    })
        .composite([
            {
                input: resizedIcon,
                gravity: 'center'
            }
        ])
        .png()
        .toFile(destinationPath);
}

async function generateLinuxPngSet() {
    fs.mkdirSync(linuxIconsDir, { recursive: true });

    for (const size of linuxSizes) {
        const filePath = path.join(linuxIconsDir, `${size}x${size}.png`);

        await generateResizedPng(sourceIconPath, filePath, size);
    }
}

async function generateIconPng() {
    await generateResizedPng(sourceIconPath, iconPngPath, 1024);
}

async function generateUiLogo() {
    await generateResizedPng(sourceIconPath, uiLogoPath, 128);
}

async function generateIconIco() {
    const icoSizes = [ 16, 24, 32, 48, 64, 128, 256 ];
    const icoInputs = icoSizes.map(size => path.join(linuxIconsDir, `${size}x${size}.png`));
    const icoBuffer = await pngToIco(icoInputs);

    fs.writeFileSync(iconIcoPath, icoBuffer);
}

function generateIconIcnsWithPng2Icons() {
    const inputBuffer = fs.readFileSync(iconPngPath);
    const icnsBuffer = png2icons.createICNS(inputBuffer, png2icons.BICUBIC, 0);

    if (!icnsBuffer) {
        console.warn('png2icons could not generate icon.icns.');

        return false;
    }

    fs.writeFileSync(iconIcnsPath, icnsBuffer);

    return true;
}

async function generateIconIcns() {
    if (generateIconIcnsWithPng2Icons()) {
        return true;
    }

    if (process.platform !== 'darwin') {
        console.log('macOS iconutil is not available on this platform.');

        return false;
    }

    const iconutilCheck = spawnSync('iconutil', [ '--help' ], { stdio: 'ignore' });

    if (iconutilCheck.error) {
        console.warn('iconutil is not available.');

        return false;
    }

    const iconsetDir = path.join(resourcesDir, 'icon.iconset');
    const iconsetMap = {
        'icon_16x16.png': 16,
        'icon_16x16@2x.png': 32,
        'icon_32x32.png': 32,
        'icon_32x32@2x.png': 64,
        'icon_128x128.png': 128,
        'icon_128x128@2x.png': 256,
        'icon_256x256.png': 256,
        'icon_256x256@2x.png': 512,
        'icon_512x512.png': 512,
        'icon_512x512@2x.png': 1024
    };

    fs.rmSync(iconsetDir, { recursive: true, force: true });
    fs.mkdirSync(iconsetDir, { recursive: true });

    try {
        for (const [ fileName, size ] of Object.entries(iconsetMap)) {
            await generateResizedPng(sourceIconPath, path.join(iconsetDir, fileName), size);
        }

        try {
            execFileSync(
                'iconutil',
                [ '-c', 'icns', iconsetDir, '-o', iconIcnsPath ],
                { stdio: 'inherit' }
            );

            return true;
        } catch (error) {
            console.warn('iconutil failed to generate icon.icns.');
            console.warn(error.message);

            return false;
        }
    } finally {
        fs.rmSync(iconsetDir, { recursive: true, force: true });
    }
}

async function main() {
    if (!fs.existsSync(sourceIconPath)) {
        throw new Error(`Source icon is missing: ${sourceIconPath}`);
    }

    const sourceMetadata = await sharp(sourceIconPath).metadata();

    if (!sourceMetadata.width || !sourceMetadata.height) {
        throw new Error('Source icon metadata is invalid.');
    }

    if (sourceMetadata.width < 1024 || sourceMetadata.height < 1024) {
        throw new Error(
            'Source icon must be at least 1024x1024 to generate required assets reliably.'
        );
    }

    await generateLinuxPngSet();
    await generateIconPng();
    await generateUiLogo();
    await generateIconIco();

    const icnsGenerated = await generateIconIcns();

    console.log('Generated PNG icon assets in resources/icons and resources/icon.png');
    console.log('Generated ICO icon asset at resources/icon.ico');
    console.log(icnsGenerated
        ? 'Generated ICNS icon asset at resources/icon.icns'
        : 'Did not generate resources/icon.icns. See BRANDING_ICON_INSTRUCTIONS.md');
}

main().catch(error => {
    console.error('Icon generation failed.');
    console.error(error);
    process.exit(1);
});
