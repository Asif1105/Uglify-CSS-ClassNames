const fs = require('fs');
const path = require('path');
const { parse } = require('node-html-parser');
const { uniqueNamesGenerator, NumberDictionary } = require('unique-names-generator');

let classNameMap = {};
let allClasses = [];

function getUglifiedName() {
    const numberDictionary = NumberDictionary.generate({ min: 100, max: 999 });
    return uniqueNamesGenerator({
        dictionaries: [
            ['a'],
            numberDictionary
        ],
        length: 2,
        separator: ''
    });
};

function augmentClassName(className) {
    return className.match('-') ? className.split('-').join('') : className;
};

function classNameGenerator(allClasses) {
    let i = 20;
    allClasses.forEach(className => {
        classNameMap[augmentClassName(className)] = getUglifiedName();
        i++;
    });
};

function replaceCSS(node) {
    const regex = new RegExp(allClasses.join('|'), 'gm');
    const allMatches = node.classNames.match(regex);
    if (allMatches) {
        allMatches.forEach(match => {
            node.classList.remove(match);
            node.classList.add(classNameMap[augmentClassName(match)]);
        });
    }
};

function uglify() {
    const htmlPath = path.resolve('./index.html');
    const cssPath = path.resolve('./style.css');
    if (fs.existsSync(htmlPath)) {
        let html = fs.readFileSync(htmlPath, 'utf8');
        let css = fs.readFileSync(cssPath, function(error, data) {
            if (error) return;
            return data;
        });
        let DOM = parse(html);
        let CSSOM = css.toString();
        allClasses = Array.from(new Set([...DOM.querySelectorAll('[class]').flatMap(e => e.classNames !== '' && e.classNames.toString().split(/\s+/))]));
        classNameGenerator(allClasses);
        DOM.querySelectorAll('[class]').forEach((node, i) => {
            replaceCSS(node);
        });

        allClasses.forEach(className => {
            const uglifiedClassName = classNameMap[augmentClassName(className)];
            CSSOM = CSSOM.replaceAll(`.${className}`, `.${uglifiedClassName}`);
        });
        fs.writeFileSync(htmlPath, DOM.toString());
        fs.writeFileSync(cssPath, CSSOM);
    }
};

module.exports = {
    uglify
};