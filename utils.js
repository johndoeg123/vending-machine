function log(string) {
    console.log('\x1b[36m[Vending Machine] --> %s\x1b[0m  ', string);
}

module.exports.log = log;