
def bytesXor(a, b):
    return bytes([i ^ j for (i, j) in zip(a, b)])
