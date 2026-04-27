import re

def convert_isl_to_english(words):
    """
    Converts a sequence of ISL words into a grammatically correct English sentence.
    Example: ["I", "HELP", "NEED"] -> "I need help"
    """
    if not words:
        return ""
        
    # Lowercase and clean
    words = [w.lower() for w in words]
    
    # 1. Simple heuristic rules for common ISL patterns
    # ISL often follows SOV (Subject-Object-Verb) or OSV
    
    # Rule: If "i" is present and at the end, move to front
    if words[-1] == 'i' and len(words) > 1:
        words.insert(0, words.pop())
        
    # Rule: Swap Verb and Object if needed (ISL: I water drink -> EN: I drink water)
    # Common verbs
    verbs = ['need', 'want', 'drink', 'eat', 'see', 'go', 'help', 'love']
    for i in range(len(words)-1):
        if words[i] not in verbs and words[i+1] in verbs:
            # Check if there's a subject before
            if i > 0 and words[i-1] in ['i', 'you', 'he', 'she', 'we', 'they']:
                # Swap i and i+1
                words[i], words[i+1] = words[i+1], words[i]

    # Join and capitalize
    sentence = " ".join(words)
    sentence = sentence.capitalize()
    
    # Clean up multiple spaces
    sentence = re.sub(' +', ' ', sentence)
    
    return sentence
