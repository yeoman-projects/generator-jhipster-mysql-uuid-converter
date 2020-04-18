const TPL = 'template';

const copyFiles = (gen, files) => {
    files.forEach((file) => {
        gen.copyTemplate(file.from, file.to, file.type ? file.type : TPL, gen, file.interpolate ? {
            interpolate: file.interpolate
        } : undefined);
    });
};

module.exports = {
    copyFiles
};
