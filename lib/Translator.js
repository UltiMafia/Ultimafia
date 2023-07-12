class Translator {
    constructor() {
    }

    phrases1 = [];
    phrases2 = [];
    words1 = [];
    words2 = [];
    intraword1 = [];
    intraword2 = [];
    prefixes1 = [];
    prefixes2 = [];
    suffixes1 = [];
    suffixes2 = [];
    regex1 = [];
    regex2 = [];
    rev_regex1 = [];
    rev_regex2 = [];
    ordering1 = [];
    ordering2 = [];

    reverseIsDisabled = false;
    doApplySentenceCase = null;
    backward = null;
    forward = null;

    replaceNonMatching = true;

    numRules() {
        return this.phrases1.length + this.phrases2.length + this.words1.length + this.words2.length + this.intraword1.length + this.intraword2.length + this.prefixes1.length + this.prefixes2.length + this.suffixes1.length + this.suffixes2.length + this.regex1.length + this.regex2.length + this.rev_regex1.length + this.rev_regex2.length + this.ordering1.length + this.ordering2.length;
    }

    doneToken = "<22><><EFBFBD><EFBFBD>}<7D>";
    sentenceCount = 0;
    
    translate(text, direction) {
        if (direction === "backward" && this.reverseIsDisabled) return $("#english-text").val();

        if (text == "") return "";
        var translatedText = "";
        if (!([].concat(this.phrases1, this.phrases2, this.words1, this.words2, this.intraword1, this.intraword2, this.prefixes1, this.prefixes2, this.suffixes1, this.suffixes2, this.regex1, this.regex2, this.rev_regex1, this.rev_regex2, this.ordering1, this.ordering2).join("").length === 0)) {
            this.sentenceCount = 0;
            var sentenceArray = text.split(/(\.)/g);
            sentenceArray = sentenceArray.filter(function (s) {
                return s !== "";
            })
            for (var i = 0; i < sentenceArray.length; i++) {
                text = sentenceArray[i];
                if (text === ".") {
                    translatedText += ".";
                    continue;
                }
                if (text.trim() === "") {
                    translatedText += text;
                    continue;
                }
                var startsWithSpace = false;
                if (text[0] === " ") {
                    startsWithSpace = true;
                }
                var firstLetterIsCapital = false;
                if (text.trim()[0] === text.trim()[0].toUpperCase()) {
                    firstLetterIsCapital = true;
                }
                if (direction == "backward") {
                    text = this.intrawordSwap(this.intraword2, this.intraword1, text);
                    text = " " + text + " ";
                    text = text.toLowerCase();
                    text = text.split("\n").join(" 985865568NEWLINETOKEN98758659 ");
                    text = this.phraseSwap(this.phrases2, this.phrases1, text);
                    text = this.wordSwap(this.words2, this.words1, text);
                    text = this.prefixSwap(this.prefixes2, this.prefixes1, text);
                    text = this.suffixSwap(this.suffixes2, this.suffixes1, text);
                    text = this.removeDoneTokens(text);
                    text = text.split(this.doneToken).join("");
                    text = text.trim();
                    text = this.regexReplace(this.rev_regex1, this.rev_regex2, text);
                    text = this.wordOrdering(this.ordering2, this.ordering1, text);
                } else {
                    text = this.intrawordSwap(this.intraword1, this.intraword2, text);
                    text = " " + text + " ";
                    text = text.toLowerCase();
                    text = text.split("\n").join(" 985865568NEWLINETOKEN98758659 ");
                    text = this.phraseSwap(this.phrases1, this.phrases2, text);
                    text = this.wordSwap(this.words1, this.words2, text);
                    text = this.prefixSwap(this.prefixes1, this.prefixes2, text);
                    text = this.suffixSwap(this.suffixes1, this.suffixes2, text);
                    text = this.removeDoneTokens(text);
                    text = text.split(this.doneToken).join("");
                    text = text.trim();
                    text = this.regexReplace(this.regex1, this.regex2, text);
                    text = this.wordOrdering(this.ordering1, this.ordering2, text);
                }
                text = text.split(" 985865568NEWLINETOKEN98758659 ").join("\n");
                text = text.split(" 985865568NEWLINETOKEN98758659").join("\n");
                text = text.split("985865568NEWLINETOKEN98758659").join("\n");
                text = text.replace(/(\b\S+\b)[ ]+\b\1\b/gi, "$1 $1");
                if (firstLetterIsCapital) {
                    text = text[0].toUpperCase() + text.substr(1);
                }
                if (startsWithSpace) {
                    text = " " + text;
                }
                translatedText += text;
                this.sentenceCount++;
            }
            translatedText = translatedText.split('{{*DUPLICATE MARKER*}}').join('');
            if (typeof this.doApplySentenceCase !== 'undefined') {
                if (this.doApplySentenceCase !== false) {
                    translatedText = this.applySentenceCase(translatedText);
                    translatedText = this.capitalizeFirstLetter(translatedText);
                }
            }
        } else {
            translatedText = text;
        }
        if (direction == "backward" && typeof this.backward === "function") {
            translatedText = this.backward(translatedText);
        } else if (typeof this.forward === "function") {
            translatedText = this.forward(translatedText);
        }
        return translatedText;
    }

    applySentenceCase(str) {
        return str.replace(/.+?[\.\?\!](\s|$)/g, function (txt) {
            if (txt.charAt(0).match(/[a-z]/g) !== null) return txt.charAt(0).toUpperCase() + txt.substr(1); else return txt;
        });
    }

    capitalizeFirstLetter(string) {
        if (string.charAt(0).match(/[a-z]/g) !== null) return string.charAt(0).toUpperCase() + string.slice(1); else return string;
    }

    phraseSwap(phrases1, phrases2, text) {
        var wordSeps = [" ", ",", ".", "'", "!", ":", "?", "\"", ";", "/", "<", ">", ")", "(", "%", "$"];
        var phrases2 = this.makeArrayClone(phrases2);
        for (var i = 0; i < phrases2.length; i++) {
            phrases2[i] = this.tokenate(phrases2[i]);
        }
        for (var i = 0; i < phrases1.length; i++) {
            for (var j = 0; j < wordSeps.length; j++) {
                if (phrases2[i] !== "") text = text.split(" " + phrases1[i].toLowerCase() + wordSeps[j]).join(" " + phrases2[i] + wordSeps[j]); else text = text.split(" " + phrases1[i].toLowerCase() + wordSeps[j]).join(" ");
            }
        }
        return text;
    }

    wordSwap(words1, words2, text) {
        var wordSeps = [" ", ",", ".", "'", "!", ":", "?", "\"", ";", "/", "<", ">", ")", "(", "%", "$"];
        text = text.replace(/(\b\S+\b)\s+\b\1\b/i, "$1  $1");
        var words2 = this.makeArrayClone(words2);
        for (var i = 0; i < words2.length; i++) {
            words2[i] = this.tokenate(words2[i]);
        }
        var words1_notags = [];
        for (var i = 0; i < words1.length; i++) {
            if (words1[i] instanceof Array) {
                words1_notags[i] = [];
                for (var j = 0; j < words1[i].length; j++) {
                    words1_notags[i][j] = words1[i][j].replace(/\{\{.*\}\}/g, "");
                }
            } else {
                words1_notags[i] = words1[i].replace(/\{\{.*\}\}/g, "");
            }
        }
        for (var i = 0; i < words1_notags.length; i++) {
            if (words2[i] instanceof Array) {
                var l = words2[i].length;
                var swapWithThis = words2[i][Math.floor(Math.random() * words2[i].length)];
            } else {
                var swapWithThis = words2[i];
            }
            for (var j = 0; j < wordSeps.length; j++) {
                if (words1_notags[i] instanceof Array) {
                    for (var k = 0; k < words1_notags[i].length; k++) {
                        if (swapWithThis.length > 0) text = text.split(" " + words1_notags[i][k].toLowerCase() + wordSeps[j]).join(" " + swapWithThis + wordSeps[j]); else text = text.split(" " + words1_notags[i][k].toLowerCase() + wordSeps[j]).join(" ");
                    }
                } else {
                    if (words1_notags[i][0] + words1_notags[i].slice(-1) == "''" || words1_notags[i][0] + words1_notags[i].slice(-1) == "\"\"") {
                        text = text.split(words1_notags[i].toLowerCase() + wordSeps[j]).join(swapWithThis + wordSeps[j]);
                    } else if (swapWithThis.length > 0) text = text.split(" " + words1_notags[i].toLowerCase() + wordSeps[j]).join(" " + swapWithThis + wordSeps[j]); else text = text.split(" " + words1[i].toLowerCase() + wordSeps[j]).join(" ");
                }
            }
        }
        return text;
    }

    intrawordSwap(intraword1, intraword2, text) {
        var start = 0;
        var str = "";
        var finalText = "";
        for (var end = 0; end < text.length + 1; end++) {
            str = text.substring(start, end);
            for (var i = 0; i < intraword1.length; i++) {
                if (str.indexOf(intraword1[i]) !== -1) {
                    finalText += str.replace(intraword1[i], intraword2[i]);
                    start = end;
                    break;
                }
            }
        }
        finalText += text.substring(start, end);
        text = finalText;
        return text;
    }

    escapeRegex(regex) {
        return regex.replace(/([()[{*+.$^\\|?])/g, '\\$1');
    }

    prefixSwap(prefixes1, prefixes2, text) {
        var prefixes2 = this.makeArrayClone(prefixes2);
        for (var i = 0; i < prefixes2.length; i++) {
            prefixes2[i] = this.tokenate(prefixes2[i]);
        }
        for (var i = 0; i < prefixes1.length; i++) {
            text = text.replace(new RegExp("\\s" + this.escapeRegex(prefixes1[i]) + "([^\\s])", 'g'), " " + prefixes2[i] + "$1");
        }
        return text;
    }

    suffixSwap(suffixes1, suffixes2, text) {
        var suffixes2 = this.makeArrayClone(suffixes2);
        for (var i = 0; i < suffixes2.length; i++) {
            suffixes2[i] = this.tokenate(suffixes2[i]);
        }
        for (var i = 0; i < suffixes1.length; i++) {
            text = text.replace(new RegExp("([^\\s])" + this.escapeRegex(suffixes1[i]) + "\\s", 'g'), "$1" + suffixes2[i] + " ");
        }
        return text;
    }

    regexReplace(regex1, regex2, text) {
        for (var i = 0; i < regex1.length; i++) {
            if (typeof regex2[0] == 'string' || regex2[0] instanceof String) {
                var match = regex1[i].match(new RegExp('^/(.*?)/([gimy]*)$'));
                if (match) {
                    var properRegEx = new RegExp(match[1], match[2]);
                    text = text.replace(properRegEx, regex2[i]);
                }
            }
        }
        return text;
    }

    wordOrdering(ordering1, ordering2, text) {
        for (var i = 0; i < ordering1.length; i++) {
            var regex = new RegExp('([^\\s]+){{' + ordering1[i].trim().replace(/[\s]+/g, " ").split(" ").join('}}[\\s]+([^\\s]+){{') + '}}', 'g');
            var orderString = this.getRelativeOrder(ordering1[i].replace(/[\s]+/g, " ").split(" "), ordering2[i].replace(/[\s]+/g, " ").split(" "));
            text = text.replace(regex, "$" + orderString.split(',').join(" $"));
        }
        var alreadyRemovedTags = [];
        for (var i = 0; i < ordering1.length; i++) {
            var tags = ordering1[i].trim().replace(/[\s]+/g, " ").split(" ");
            for (var j = 0; j < tags.length; j++) {
                if (alreadyRemovedTags.indexOf(tags[j]) === -1) {
                    text = text.replace("{{" + tags[j] + "}}", "");
                    alreadyRemovedTags.push(tags[j]);
                }
            }
        }
        return text;
    }

    getRelativeOrder(truth, jumbled) {
        var order = [];
        for (var i = 0; i < jumbled.length; i++) {
            if (truth.indexOf(jumbled[i]) !== -1) {
                order.push(truth.indexOf(jumbled[i]) + 1);
            } else {
            }
        }
        return order.join(",");
    }

    removeDoneTokens(text) {
        if (this.replaceNonMatching) {
            const arrayText = text.split(this.doneToken).map(e => {
                if (e.startsWith('\\')) {
                    return e;
                }
                if (e.length > 1) {
                    return this.words2[Math.floor(Math.random()*this.words2.length)]
                }
                return e;
            });
            text = arrayText.join("");

        } else {
            text = text.split(this.doneToken).join("");
        }
        return text;
    }

    tokenate(s) {
        if (Object.prototype.toString.call(s) === '[object Array]') {
            for (var i = 0; i < s.length; i++) {
                s[i] = this.doneToken + s[i].toString().split("").join(this.doneToken) + this.doneToken;
            }
            return s;
        } else {
            return this.doneToken + s.toString().split("").join(this.doneToken) + this.doneToken;
        }
    }

    handleDuplicates(words1, words2) {
        var words1InitialLength = words1.length;
        for (var i = 0; i < words1InitialLength; i++) {
            var findDupsOf = words1[i];
            var dupArray = [];
            var foundDups = false;
            if (!(findDupsOf.substring(0, "{{*DUPLICATE MARKER*}}".length) == "{{*DUPLICATE MARKER*}}")) {
                for (var j = 0; j < words1InitialLength; j++) {
                    if ((findDupsOf == words1[j]) && (i != j)) {
                        dupArray.push(words2[j]);
                        words1[i] = "{{*DUPLICATE MARKER*}}" + words1[i];
                        words1[j] = "{{*DUPLICATE MARKER*}}" + words1[j];
                        foundDups = true;
                    }
                }
            }
            if (foundDups) {
                dupArray.push(words2[i]);
                words1.push(findDupsOf);
                words2.push(dupArray);
            }
        }
        for (var i = 0; i < words1.length; i++) {
            if (words1[i].substring(0, "{{*DUPLICATE MARKER*}}".length) === "{{*DUPLICATE MARKER*}}") {
                if (i == 0) {
                    words1.shift();
                    words2.shift();
                    i--;
                } else {
                    words1.splice(i, 1);
                    words2.splice(i, 1);
                }
            }
        }
        var result = [words1, words2];
        return result;
    }

    makeArrayClone(existingArray) {
        var newObj = (existingArray instanceof Array) ? [] : {};
        for (var i in existingArray) {
            if (i == 'clone') continue;
            if (existingArray[i] && typeof existingArray[i] == "object") {
                newObj[i] = this.makeArrayClone(existingArray[i]);
            } else {
                newObj[i] = existingArray[i]
            }
        }
        return newObj;
    }

}

module.exports = Translator