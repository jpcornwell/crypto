
def xor_bytes(a, b):
    return bytes([i ^ j for (i, j) in zip(a, b)])
