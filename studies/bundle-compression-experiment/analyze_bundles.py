import base64
import os
import hashlib

def read_file(path):
    if not os.path.exists(path):
        print(f"Error: File not found at {path}")
        return None
    with open(path, 'r') as f:
        return f.read().strip()

def analyze_wasm_similarity(path1, path2):
    print(f"Analyzing similarity between {path1} and {path2}...")
    
    s1 = read_file(path1)
    s2 = read_file(path2)
    
    if s1 is None or s2 is None:
        return

    try:
        b1 = base64.b64decode(s1)
        b2 = base64.b64decode(s2)
    except Exception as e:
        print(f"Error decoding base64: {e}")
        return

    len1 = len(b1)
    len2 = len(b2)
    
    print(f"\nByte counts:")
    print(f"Bundle 1 (ST): {len1:,} bytes")
    print(f"Bundle 2 (MT): {len2:,} bytes")
    print(f"Difference: {abs(len1 - len2):,} bytes")

    # 1. Structural similarity (prefix and suffix)
    prefix_len = 0
    min_len = min(len1, len2)
    for i in range(min_len):
        if b1[i] == b2[i]:
            prefix_len += 1
        else:
            break
            
    suffix_len = 0
    for i in range(1, min_len + 1):
        if b1[-i] == b2[-i]:
            suffix_len += 1
        else:
            break
            
    print(f"\nStructural similarity:")
    print(f"Common Prefix: {prefix_len:,} bytes ({(prefix_len/len1*100):.2f}% of ST)")
    print(f"Common Suffix: {suffix_len:,} bytes ({(suffix_len/len1*100):.2f}% of ST)")

    # 2. Block similarity (find how many chunks of X bytes are shared anywhere)
    # Using smaller chunk sizes to find smaller common fragments
    for chunk_size in [1024, 256, 64]:
        # Hash all chunks from file 1 (sliding window 1B)
        chunks1 = set()
        for i in range(0, len1 - chunk_size + 1):
            chunks1.add(hashlib.md5(b1[i:i+chunk_size]).digest())
            
        matched_chunks = 0
        total_chunks2 = 0
        # Check all chunks from file 2 (sliding window 1B)
        for i in range(0, len2 - chunk_size + 1):
            total_chunks2 += 1
            if hashlib.md5(b2[i:i+chunk_size]).digest() in chunks1:
                matched_chunks += 1
        
        print(f"\nBlock similarity (Chunk size: {chunk_size}B, 1B sliding window):")
        if total_chunks2 > 0:
            print(f"Total matching positions in MT: {matched_chunks:,} / {total_chunks2:,} ({(matched_chunks/total_chunks2*100):.2f}%)")

    # 4. Compression efficiency (simulated delta compression)
    import zlib
    
    comp1 = len(zlib.compress(b1))
    comp2 = len(zlib.compress(b2))
    comp_both = len(zlib.compress(b1 + b2))
    
    print(f"\nCompression Analysis (zlib):")
    print(f"Compressed size Bundle 1: {comp1:,} bytes")
    print(f"Compressed size Bundle 2: {comp2:,} bytes")
    print(f"Compressed size (1 then 2): {comp_both:,} bytes")
    print(f"Compression savings if shared: {((comp1 + comp2) - comp_both):,} bytes ({(((comp1 + comp2) - comp_both) / (comp1 + comp2) * 100):.2f}%)")

if __name__ == "__main__":
    analyze_wasm_similarity(
        'studies/bundle-compression-experiment/bundle1.txt',
        'studies/bundle-compression-experiment/bundle2.txt'
    )
