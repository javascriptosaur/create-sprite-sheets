const texturePacker = require('free-tex-packer-core'); //https://github.com/odrick/free-tex-packer-core
const fs = require('fs');
const path = require('path');

const imagemin = require('imagemin');
const imageminPngquant = require('imagemin-pngquant');

let {
    DETECT_ANIMATIONS = 0,
    ALLOW_ROTATION = 1,
    //TINIFY_KEY = 'WhXKG1vHL7XqYzGfBh6fST27SWHnnJ59', //https://tinypng.com
    TINIFY_KEY = '',
    IMAGEMIN = 1,
} = process.env;
DETECT_ANIMATIONS = !!+DETECT_ANIMATIONS;
ALLOW_ROTATION = !!+ALLOW_ROTATION;
IMAGEMIN = !!+IMAGEMIN;

const INPUT = path.join(__dirname, 'input');
const OUTPUT = path.join(__dirname, 'output');

let options = {
    width: 2048,
    height: 2048,
    fixedSize: false,
    padding: 2,
    allowRotation: ALLOW_ROTATION,
    detectIdentical: true,
    allowTrim: true,
    exporter: 'Pixi',
    removeFileExtension: true,
    prependFolderName: true,
};
if (TINIFY_KEY) {
    options.tinify = true;
    options.tinifyKey = TINIFY_KEY;
}

//конвертирует windows путь в unix
const slash = (input) => {
    const isExtendedLengthPath = /^\\\\\?\\/.test(input);
    const hasNonAscii = /[^\u0000-\u0080]+/.test(input);
    return isExtendedLengthPath || hasNonAscii ? input : input.replace(/\\/g, '/');
};
//схлопывает многомерный массив в одномерный
const flatten = (arr1) => arr1.reduce((acc, val) => (Array.isArray(val) ? acc.concat(flatten(val)) : acc.concat(val)), []);
//возвращает массив файлов в директории(рекурсивно)
const walkSync = (d) => (fs.statSync(d).isDirectory() ? fs.readdirSync(d).map((f) => walkSync(path.join(d, f))) : d);
//очищает директорию
const clearFolderSync = (p, remove = false) => {
    if (fs.existsSync(p)) {
        fs.readdirSync(p).forEach((file) => {
            const curPath = path.join(p, file);
            if (fs.statSync(curPath).isDirectory()) {
                clearFolderSync(curPath, true);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        if (remove) {
            fs.rmdirSync(p);
        }
    }
};

if(!fs.existsSync(OUTPUT)){
    fs.mkdirSync(OUTPUT);
}
clearFolderSync(OUTPUT);

fs.readdirSync(INPUT).forEach((textureName) => {
    //папки начинающиеся на точку игнорирую
    if (!/^\./.test(textureName)) {
        const input = path.join(INPUT, textureName);

        let files = flatten([...walkSync(input)]).map((f) => slash(path.relative(input, f)));

        let images = files.map((f) => ({ path: f, contents: fs.readFileSync(path.join(input, f)) }));

        options.textureName = textureName;

        texturePacker(images, options, async (files) => {
            for (let item of files) {
                if (/\.json$/.test(item.name) && DETECT_ANIMATIONS) {
                    const obj = JSON.parse(item.buffer.toString());

                    const animations = {};

                    Object.keys(obj.frames).forEach((f) => {
                        const arr = f.match(/^(.*?)_?(\d+)$/);
                        //возможно это анимация
                        if (arr) {
                            if (!animations[arr[1]]) {
                                animations[arr[1]] = [];
                            }
                            animations[arr[1]].push(f);
                        }
                    });

                    Object.keys(animations).forEach((key) => {
                        animations[key].sort((a, b) => +a.match(/^.*?(\d+)$/)[1] - +b.match(/^.*?(\d+)$/)[1]);
                    });

                    obj.animations = animations;
                    fs.writeFileSync(path.join(OUTPUT, item.name), JSON.stringify(obj, null, 2));
                } else {
                    const buffer = !IMAGEMIN
                        ? item.buffer
                        : await imagemin.buffer(item.buffer, {
                              plugins: [
                                  imageminPngquant({
                                      quality: [0.6, 0.8],
                                  }),
                              ],
                          });
                    fs.writeFileSync(path.join(OUTPUT, item.name), buffer);
                }
            }
        });
    }
});
