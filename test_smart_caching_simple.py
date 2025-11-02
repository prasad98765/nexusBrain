#!/usr/bin/env python3
"""
Simple test for Smart Caching logic (pattern-based only)
"""

import re

def test_follow_up_patterns():
    """Test pattern-based follow-up detection"""
    print("🧪 Testing Follow-Up Pattern Detection...\n")
    
    # Follow-up patterns (same as in llm_routes.py)
    follow_up_patterns = [
        r'^(and|but|also|what about|how about|tell me (more )?about)\s',
        r'\b(it|that|this|them|they|those|these|its|his|her|their)\b',
        r'^(why|how|when|where|who|what)\s+(is|are|was|were|does|did)\s+(it|that|this|they|them)',
        r'\b(more|else|another|other|similar)\b(?!\w)',
        r'^(yes|no|ok|okay|sure|right|exactly)',
    ]
    
    test_cases = [
        # (question, should_match, description)
        ("How does it work?", True, "Contains pronoun 'it'"),
        ("And what about Vue?", True, "Starts with 'and'"),
        ("Tell me more", True, "Contains 'more'"),
        ("What is React?", False, "Standalone question"),
        ("Explain neural networks", False, "New topic"),
        ("But why?", True, "Starts with 'but'"),
        ("Also consider this", True, "Starts with 'also'"),
        ("What about Python?", True, "Starts with 'what about'"),
        ("That's interesting", True, "Contains 'that'"),
        ("Yes, tell me more", True, "Starts with 'yes'"),
        ("How do I use Python?", False, "Standalone how question"),
        ("Another example please", True, "Contains 'another'"),
    ]
    
    passed = 0
    failed = 0
    
    for question, should_match, description in test_cases:
        matched = False
        current_lower = question.lower().strip()
        
        for pattern in follow_up_patterns:
            if re.search(pattern, current_lower):
                matched = True
                break
        
        status = "✅" if matched == should_match else "❌"
        result = "PASS" if matched == should_match else "FAIL"
        
        print(f"{status} {result}: '{question}'")
        print(f"   Expected: {'follow-up' if should_match else 'standalone'}")
        print(f"   Got: {'follow-up' if matched else 'standalone'}")
        print(f"   Reason: {description}")
        print()
        
        if matched == should_match:
            passed += 1
        else:
            failed += 1
    
    print(f"Results: {passed} passed, {failed} failed out of {len(test_cases)} tests")
    
    if failed == 0:
        print("\n✅ All pattern detection tests passed!")
        return True
    else:
        print(f"\n❌ {failed} tests failed")
        return False


def test_word_count_detection():
    """Test word count-based detection"""
    print("\n🧪 Testing Word Count Detection...\n")
    
    test_cases = [
        ("Hi", 1, True, "Very short"),
        ("Really?", 1, True, "Single word question"),
        ("Tell me", 2, True, "2 words"),
        ("What is React?", 3, False, "3 words - threshold"),
        ("How does it work?", 4, False, "4 words"),
        ("Explain neural networks in detail", 5, False, "5+ words"),
    ]
    
    passed = 0
    failed = 0
    
    for question, word_count, should_be_short, description in test_cases:
        actual_count = len(question.split())
        is_short = actual_count < 5  # Same threshold as in llm_routes.py
        
        status = "✅" if is_short == should_be_short else "❌"
        result = "PASS" if is_short == should_be_short else "FAIL"
        
        print(f"{status} {result}: '{question}' ({actual_count} words)")
        print(f"   Expected: {'short' if should_be_short else 'not short'}")
        print(f"   Got: {'short' if is_short else 'not short'}")
        print(f"   Reason: {description}")
        print()
        
        if is_short == should_be_short:
            passed += 1
        else:
            failed += 1
    
    print(f"Results: {passed} passed, {failed} failed out of {len(test_cases)} tests")
    
    if failed == 0:
        print("\n✅ All word count tests passed!")
        return True
    else:
        print(f"\n❌ {failed} tests failed")
        return False


def test_caching_scenarios():
    """Test complete caching scenarios"""
    print("\n🧪 Testing Caching Scenarios...\n")
    
    follow_up_patterns = [
        r'^(and|but|also|what about|how about|tell me (more )?about)\s',
        r'\b(it|that|this|them|they|those|these|its|his|her|their)\b',
        r'^(why|how|when|where|who|what)\s+(is|are|was|were|does|did)\s+(it|that|this|they|them)',
        r'\b(more|else|another|other|similar)\b(?!\w)',
        r'^(yes|no|ok|okay|sure|right|exactly)',
    ]
    
    scenarios = [
        {
            "question": "What is React?",
            "has_context": False,
            "should_cache": True,
            "reason": "First question, no context"
        },
        {
            "question": "How does it work?",
            "has_context": True,
            "should_cache": False,
            "reason": "Follow-up (pronoun 'it')"
        },
        {
            "question": "And what about Vue?",
            "has_context": True,
            "should_cache": False,
            "reason": "Follow-up (starts with 'and')"
        },
        {
            "question": "Why?",
            "has_context": True,
            "should_cache": False,
            "reason": "Short question with context"
        },
        {
            "question": "Explain machine learning",
            "has_context": True,
            "should_cache": True,
            "reason": "New topic (no follow-up patterns)"
        },
        {
            "question": "Hi",
            "has_context": False,
            "should_cache": False,
            "reason": "Too short (< 3 words)"
        },
    ]
    
    passed = 0
    failed = 0
    
    for scenario in scenarios:
        question = scenario["question"]
        has_context = scenario["has_context"]
        should_cache = scenario["should_cache"]
        reason = scenario["reason"]
        
        # Determine if it's a follow-up
        is_follow_up = False
        current_lower = question.lower().strip()
        
        # Pattern matching
        for pattern in follow_up_patterns:
            if re.search(pattern, current_lower):
                is_follow_up = True
                break
        
        # Word count check with context
        word_count = len(question.split())
        if word_count < 5 and has_context:
            is_follow_up = True
        
        # Caching decision
        will_cache = not is_follow_up and word_count >= 3
        
        status = "✅" if will_cache == should_cache else "❌"
        result = "PASS" if will_cache == should_cache else "FAIL"
        
        print(f"{status} {result}: '{question}'")
        print(f"   Context: {'Yes' if has_context else 'No'}")
        print(f"   Is follow-up: {is_follow_up}")
        print(f"   Word count: {word_count}")
        print(f"   Will cache: {will_cache}")
        print(f"   Should cache: {should_cache}")
        print(f"   Reason: {reason}")
        print()
        
        if will_cache == should_cache:
            passed += 1
        else:
            failed += 1
    
    print(f"Results: {passed} passed, {failed} failed out of {len(scenarios)} scenarios")
    
    if failed == 0:
        print("\n✅ All caching scenario tests passed!")
        return True
    else:
        print(f"\n❌ {failed} scenarios failed")
        return False


def main():
    print("=" * 60)
    print("Smart Caching - Pattern & Logic Tests")
    print("=" * 60)
    print()
    
    results = []
    
    # Test 1: Pattern detection
    results.append(test_follow_up_patterns())
    
    # Test 2: Word count detection
    results.append(test_word_count_detection())
    
    # Test 3: Caching scenarios
    results.append(test_caching_scenarios())
    
    print("=" * 60)
    if all(results):
        print("✅ All tests passed!")
        print("=" * 60)
        return 0
    else:
        print("❌ Some tests failed")
        print("=" * 60)
        return 1


if __name__ == "__main__":
    exit(main())
