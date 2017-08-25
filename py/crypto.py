from collections import Counter
from itertools import cycle

def hamming_distance(a, b):
    assert len(a) == len(b)
    xor_result = xor_bytes(a, b)
    return sum([bin(byte_val).count('1') for byte_val in xor_result])

def xor_bytes(a, b):
    return bytes([i ^ j for (i, j) in zip(a, cycle(b))])

# given text, will give back a score representing how close it is
# to english text (a lower score is more likely to be english)
def score_english_text(text):
    english_freqs = { 'a': 0.08167, 'b': 0.01492, 'c': 0.02782, 'd': 0.04253,
                      'e': 0.12702, 'f': 0.02228, 'g': 0.02015, 'h': 0.06094, 
                      'i': 0.06966, 'j': 0.00153, 'k': 0.00772, 'l': 0.04025, 
                      'm': 0.02406, 'n': 0.06749, 'o': 0.07507, 'p': 0.01929, 
                      'q': 0.00095, 'r': 0.05987, 's': 0.06327, 't': 0.09056,
                      'u': 0.02758, 'v': 0.00978, 'w': 0.02360, 'x': 0.00150, 
                      'y': 0.01974, 'z': 0.00074, ' ': 0.12702 }

    text = text.lower()

    counts = Counter(text)

    score = 0
    for (char, freq) in english_freqs.items():
        expected = freq * len(text)
        score += (counts[char] - expected) ** 2 / expected

    # take into account characters that are not present in english_freqs
    # (the greater the number of unusual characters, the less likely it
    #  is english)
    for char in (set(text) - set(english_freqs)):
        expected = 0.0001 * len(text)
        score += (counts[char] - expected) ** 2 / expected

    return score

def crack_single_byte_xor(input):
    candidates = []

    for key in range(256):
        candidate = xor_bytes(input, bytes([key]))
        score = score_english_text(candidate.decode('ascii', 'replace'))
        candidates.append({
            'plain_text': candidate, 
            'score': score, 
            'key': key})

    return min(candidates, key=lambda x: x['score'])
