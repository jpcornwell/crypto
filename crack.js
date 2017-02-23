var crypto = require('crypto');

module.exports = {
    crackEcbByteAtATime: crackEcbByteAtATime,
    crackRepeatingKeyXor: crackRepeatingKeyXor,
    crackSingleByteXor: crackSingleByteXor,
    scoreEnglishText: scoreEnglishText,
}

function crackEcbByteAtATime(blackBox) {
    var blockSize;
    var numberOfBlocks;
    var target = [];
    var dictionaryGenBase = [];
    var dictionary;
    var offsetPrefix;
    var targetByteValue;

    blockSize = findBlockSize(blackBox);
    isEcb = checkIfEcb(blackBox);
    if (!checkIfEcb(blackBox)) {
        console.log('The given black box is not in ecb mode!');
    }

    // initialize dictionaryGenBase
    for (var i = 0; i < blockSize - 1; i++) {
        dictionaryGenBase.push(255);
    }

    numberOfBlocks = blackBox([]).length / blockSize;
    for (var i = 0; i < numberOfBlocks; i++) {
        offsetPrefix = [];
        for (var j = 0; j < blockSize - 1; j++) {
            offsetPrefix.push(255);
        }

        for (var j = 0; j < blockSize; j++) {
            dictionary = generateDictionary();
            targetByteValue = computeTargetByteValue();
            target.push(targetByteValue);
            dictionaryGenBase = dictionaryGenBase.slice(1);
            dictionaryGenBase.push(targetByteValue);

            offsetPrefix = offsetPrefix.slice(1);
        }
    }

    return target;

    function generateDictionary() {
        // note: key is value returned by black box, value is input
        var dictionary = {};
        var key;
        var value;

        for (var i = 0; i < 256; i++) {
            value = i;
            key = blackBox(dictionaryGenBase.concat([i])).slice(0, blockSize);
            dictionary[crypto.hexEncode(key)] = value;
        }

        return dictionary;
    }

    function computeTargetByteValue() {
        var output;

        output = blackBox(offsetPrefix);
        output = output.slice(blockSize * i, blockSize * (i + 1));
        output = crypto.hexEncode(output);
        return dictionary[output];
    }

    function findBlockSize(blackBox) {
        var firstLength;
        var secondLength;
        var input;
        var output;

        input = crypto.asciiDecode('a');
        output = blackBox(input);
        firstLength = output.length;
        secondLength = output.length;
        while (firstLength === secondLength) {
            input = crypto.asciiDecode(crypto.asciiEncode(input) + 'a');
            output = blackBox(input);
            secondLength = output.length;
        }
        
        return secondLength - firstLength;
    }

    function checkIfEcb(blackBox) {
        var input = new Uint8Array(blockSize * 2);
        for (var i = 0; i < input.length; i ++) {
            input[i] = 255;
        }
        var output = blackBox(input);

        for (var i = 0; i < blockSize; i++) {
            if (output[i] !== output[i + blockSize]) {
                return false;
            }
        }

        return true;
    }
}

function crackRepeatingKeyXor(input) {
    var keySize = guessKeySize(input);
    var key = guessKey(input, keySize);
    var text = crypto.asciiEncode(applyRepeatingKeyXor(input, key));
    return {text: text, key: key};

    function guessKeySize(input) {
        var low = 2;
        var hi = 40;

        var bestScore = 9999; // lower is better
        var bestSize = 0;
        for (var currentSize = low; currentSize <= hi; currentSize++) {
            var currentScore = scoreKeySize(input, currentSize);
            if (currentScore < bestScore) {
                bestScore = currentScore;
                bestSize = currentSize;
            }
        }

        return bestSize;
    }

    function scoreKeySize(input, keySize) {
        
        // split input into blocks of length keySize
        var blocks = [];
        var currentBlock = [];
        for (var i = 0, j = 0; i < input.length; i++) {
            currentBlock.push(input[i]);
            j++;
            if (j >= keySize) {
                blocks.push(currentBlock);
                currentBlock = [];
                j = 0;
            }
        }
       
        
        // compute list of normalized Hamming distances
        // compare block 1 with 2, 3 with 4, etc.
        var distances = [];
        for (var i = 0; i < blocks.length - 1; i += 2) {
            var hammingDistance = crypto.findHammingDistance(blocks[i], 
                    blocks[i+1]);
            var normalizedDistance = hammingDistance / keySize;
            distances.push(normalizedDistance);
        }

        // find the average of the distances
        var sum = 0;
        for (var i = 0; i < distances.length; i++) {
            sum += distances[i];
        }
        var averageDist = sum / distances.length;

        return averageDist;
    }

    function guessKey(input, keySize) {
        var blocks = [];
        for (var i = 0; i < keySize; i++) {
            blocks.push([]);
        }

        for (var i = 0; i < input.length; i++) {
            blocks[i%keySize].push(input[i]);
        }

        key = [];
        for (var i = 0; i < blocks.length; i++) {
            var keyByte = crackSingleByteXor(blocks[i])[0].key;
            key.push(keyByte);
        }

        return key;
    }
}

function crackSingleByteXor(input, num) {
    num = num || 1;

    var candidates = [];

    for (var i = 0; i <= 255; i++) {
        var currentCandidate = crypto.applyRepeatingKeyXor(input, [i]);
        currentCandidate = crypto.asciiEncode(currentCandidate);
        var currentScore = scoreEnglishText(currentCandidate);
        candidates.push({text: currentCandidate, score: currentScore, key: i});
    }

    candidates.sort(function (a, b) {
        if (a.score < b.score) return -1;
        if (a.score > b.score) return 1;
        return 0;
    });

    candidates.splice(num);

    return candidates;
}

function scoreEnglishText(text) {
    var englishFreq = {
        'a': 0.08167, 'b': 0.01492, 'c': 0.02782, 'd': 0.04253, 'e': 0.12702, 
        'f': 0.02228, 'g': 0.02015, 'h': 0.06094, 'i': 0.06966, 'j': 0.00153, 
        'k': 0.00772, 'l': 0.04025, 'm': 0.02406, 'n': 0.06749, 'o': 0.07507, 
        'p': 0.01929, 'q': 0.00095, 'r': 0.05987, 's': 0.06327, 't': 0.09056, 
        'u': 0.02758, 'v': 0.00978, 'w': 0.02360, 'x': 0.00150, 'y': 0.01974, 
        'z': 0.00074, ' ': 0.12702
    };

    text = text.toLowerCase();

    // initialize counts
    var counts = {};
    for (var i = 97; i <= 122; i++) {
        var char = String.fromCharCode(i);
        counts[char] = 0;
    }
    counts[' '] = 0;
    
    // count characters
    for (var i = 0; i < text.length; i++) {
        var char = text[i];
        var charCode = char.charCodeAt();
        // if char is a-z or space character
        if ((charCode >= 97 && charCode <= 122) || charCode === 32) {
            counts[char] += 1;
        } else if (counts[char] === undefined) {
            counts[char] = 1;
            englishFreq[char] = 0.001;
        } else {
            counts[char] += 1;
        }
    }

    // calculate score
    var score = 0;
    Object.keys(counts).forEach(function (char) {
        var expected = englishFreq[char] * text.length;
        score += (Math.pow(counts[char] - expected, 2) / expected);
    });

    return score;
}

