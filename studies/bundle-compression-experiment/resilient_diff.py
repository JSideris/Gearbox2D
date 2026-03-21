import base64
import hashlib
import os

def read_file(path):
    with open(path, 'r') as f:
        return f.read().strip()

def analyze_byte_islands(path1, path2):
    print(f"--- Resilient Byte-Level Analysis ---")
    s1 = read_file(path1)
    s2 = read_file(path2)
    b1 = base64.b64decode(s1)
    b2 = base64.b64decode(s2)
    
    len1, len2 = len(b1), len(b2)
    print(f"ST: {len1:,} bytes | MT: {len2:,} bytes\n")

    # We'll use a "Rolling Hash" or just a simplified block-matching visualization.
    # Let's find the longest common sequences to see if they 'realign'.
    
    def find_all_matches(data1, data2, min_size=128):
        """
        Finds non-overlapping matching blocks greedily.
        Returns list of (start1, start2, size)
        """
        matches = []
        # To make it fast, we use a dictionary of chunks from data1
        chunk_size = 32
        lookup = {}
        for i in range(0, len(data1) - chunk_size + 1, 8): # Stride 8 for speed
            chunk = data1[i:i+chunk_size]
            if chunk not in lookup:
                lookup[chunk] = []
            lookup[chunk].append(i)
            
        # Scan data2
        i2 = 0
        while i2 < len(data2) - chunk_size:
            chunk = data2[i2:i2+chunk_size]
            if chunk in lookup:
                # Potential match found
                best_match = (0, 0, 0) # start1, start2, size
                for i1_start in lookup[chunk]:
                    # Expand match backwards
                    s1, s2 = i1_start, i2
                    while s1 > 0 and s2 > 0 and data1[s1-1] == data2[s2-1]:
                        s1 -= 1
                        s2 -= 1
                    
                    # Expand match forwards
                    e1, e2 = i1_start + chunk_size, i2 + chunk_size
                    while e1 < len(data1) and e2 < len(data2) and data1[e1] == data2[e2]:
                        e1 += 1
                        e2 += 1
                    
                    size = e1 - s1
                    if size > best_match[2]:
                        best_match = (s1, s2, size)
                
                if best_match[2] >= min_size:
                    matches.append(best_match)
                    i2 = best_match[1] + best_match[2]
                    continue
            i2 += 1
        return matches

    print(f"Searching for identical byte islands (min {128} bytes)...")
    matches = find_all_matches(b1, b2, min_size=128)
    
    if not matches:
        print("No identical islands larger than 128 bytes found.")
    else:
        total_matched = sum(m[2] for m in matches)
        print(f"Found {len(matches)} islands.")
        print(f"Total matched bytes in islands: {total_matched:,} ({(total_matched/min(len1, len2)*100):.2f}%)")
        
        print("\nTop 10 Largest Islands:")
        matches.sort(key=lambda x: x[2], reverse=True)
        for i, (s1, s2, size) in enumerate(matches[:10]):
            offset = s2 - s1
            print(f"[{i+1}] Size: {size:6,} | ST Index: {s1:8,} | MT Index: {s2:8,} | Shift: {offset:8,}")

    # Check for specific WASM section differences
    # WASM Header: 8 bytes
    print(f"\nWASM Header Match: {b1[:8] == b2[:8]}")
    
if __name__ == "__main__":
    analyze_byte_islands(
        'studies/bundle-compression-experiment/bundle1.txt',
        'studies/bundle-compression-experiment/bundle2.txt'
    )
